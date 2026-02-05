import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const Decimal = Prisma.Decimal;

const paymentSchema = z.object({
    amount: z.number().positive("Le montant doit être positif"),
    paymentDate: z.string().transform((str) => new Date(str)),
    paymentMethod: z.enum([
        "CASH",
        "BANK_TRANSFER",
        "CHECK",
        "MOBILE_MONEY",
        "CARD",
        "OTHER",
    ]),
    reference: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Liste des paiements d'une facture
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const payments = await prisma.payment.findMany({
            where: { invoiceId: id },
            orderBy: { paymentDate: "desc" },
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error("Erreur lors de la récupération des paiements:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des paiements" },
            { status: 500 }
        );
    }
}

// POST - Enregistrer un paiement
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const validatedData = paymentSchema.parse(body);

        // Récupérer la facture
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { payments: true },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "Facture introuvable" },
                { status: 404 }
            );
        }

        if (invoice.status === "DRAFT") {
            return NextResponse.json(
                { error: "Impossible d'enregistrer un paiement sur une facture brouillon" },
                { status: 400 }
            );
        }

        if (invoice.status === "CANCELLED") {
            return NextResponse.json(
                { error: "Impossible d'enregistrer un paiement sur une facture annulée" },
                { status: 400 }
            );
        }

        // Calculer le montant déjà payé
        const totalPaid = invoice.payments.reduce(
            (sum: number, p: { amount: unknown }) => sum + Number(p.amount),
            0
        );
        const remaining = Number(invoice.totalTTC) - totalPaid;

        if (validatedData.amount > remaining) {
            return NextResponse.json(
                {
                    error: `Le montant dépasse le solde restant (${remaining.toLocaleString("fr-FR")} XOF)`
                },
                { status: 400 }
            );
        }

        // Créer le paiement
        const payment = await prisma.payment.create({
            data: {
                invoiceId: id,
                amount: new Decimal(validatedData.amount),
                paymentDate: validatedData.paymentDate,
                paymentMethod: validatedData.paymentMethod,
                reference: validatedData.reference,
                notes: validatedData.notes,
            },
        });

        // Mettre à jour le montant payé et le statut de la facture
        const newAmountPaid = totalPaid + validatedData.amount;
        const newStatus =
            newAmountPaid >= Number(invoice.totalTTC) ? "PAID" : "PARTIALLY_PAID";

        await prisma.invoice.update({
            where: { id },
            data: {
                amountPaid: new Decimal(newAmountPaid),
                status: newStatus,
            },
        });

        // Créer l'écriture comptable pour le paiement
        await createPaymentAccountingEntry(invoice, payment, validatedData);

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du paiement:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Erreur lors de l'enregistrement du paiement" },
            { status: 500 }
        );
    }
}

// Créer l'écriture comptable pour un paiement
async function createPaymentAccountingEntry(
    invoice: { companyId: string; number: string },
    payment: { id: string },
    data: { amount: number; paymentDate: Date; paymentMethod: string }
) {
    // Récupérer l'exercice fiscal actif
    const fiscalYear = await prisma.fiscalYear.findFirst({
        where: {
            companyId: invoice.companyId,
            isClosed: false,
            startDate: { lte: data.paymentDate },
            endDate: { gte: data.paymentDate },
        },
    });

    if (!fiscalYear) {
        return;
    }

    // Déterminer le compte de trésorerie selon le mode de paiement
    const treasuryAccountCode =
        data.paymentMethod === "CASH" || data.paymentMethod === "MOBILE_MONEY"
            ? "531000" // Caisse
            : "512000"; // Banque

    const accounts = await prisma.account.findMany({
        where: {
            companyId: invoice.companyId,
            code: { in: ["411000", treasuryAccountCode] },
        },
    });

    type AccountRecord = { id: string; code: string };
    const clientAccount = accounts.find((a: AccountRecord) => a.code === "411000");
    const treasuryAccount = accounts.find((a: AccountRecord) => a.code === treasuryAccountCode);

    if (!clientAccount || !treasuryAccount) {
        return;
    }

    // Créer l'écriture de paiement
    await prisma.journalEntry.create({
        data: {
            fiscalYearId: fiscalYear.id,
            entryDate: data.paymentDate,
            reference: `PAY-${invoice.number}`,
            description: `Règlement facture ${invoice.number}`,
            journalType: data.paymentMethod === "CASH" ? "CASH" : "BANK",
            isValidated: true,
            lines: {
                create: [
                    // Débit trésorerie
                    {
                        accountId: treasuryAccount.id,
                        debit: data.amount,
                        credit: 0,
                        label: `Encaissement ${invoice.number}`,
                    },
                    // Crédit client
                    {
                        accountId: clientAccount.id,
                        debit: 0,
                        credit: data.amount,
                        label: `Règlement client ${invoice.number}`,
                    },
                ],
            },
        },
    });
}
