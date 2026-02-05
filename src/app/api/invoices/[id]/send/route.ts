import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST - Émettre une facture (passer de DRAFT à SENT)
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                lines: true,
                client: true,
                company: true,
            },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "Facture introuvable" },
                { status: 404 }
            );
        }

        if (invoice.status !== "DRAFT") {
            return NextResponse.json(
                { error: "Cette facture a déjà été émise" },
                { status: 400 }
            );
        }

        if (invoice.lines.length === 0) {
            return NextResponse.json(
                { error: "La facture doit contenir au moins une ligne" },
                { status: 400 }
            );
        }

        // Mettre à jour le statut
        const updatedInvoice = await prisma.invoice.update({
            where: { id },
            data: {
                status: "SENT",
                sentAt: new Date(),
            },
        });

        // Créer les écritures comptables
        await createAccountingEntries(invoice);

        return NextResponse.json({
            message: "Facture émise avec succès",
            invoice: updatedInvoice,
        });
    } catch (error) {
        console.error("Erreur lors de l'émission de la facture:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'émission de la facture" },
            { status: 500 }
        );
    }
}

// Créer les écritures comptables pour une facture
async function createAccountingEntries(invoice: {
    id: string;
    number: string;
    companyId: string;
    clientId: string;
    issueDate: Date;
    totalHT: { toNumber: () => number } | number;
    totalTVA: { toNumber: () => number } | number;
    totalTTC: { toNumber: () => number } | number;
    lines: Array<{
        description: string;
        totalHT: { toNumber: () => number } | number;
        totalTVA: { toNumber: () => number } | number;
        accountId: string | null;
    }>;
}) {
    // Récupérer l'exercice fiscal actif
    const fiscalYear = await prisma.fiscalYear.findFirst({
        where: {
            companyId: invoice.companyId,
            isClosed: false,
            startDate: { lte: invoice.issueDate },
            endDate: { gte: invoice.issueDate },
        },
    });

    if (!fiscalYear) {
        console.warn("Aucun exercice fiscal trouvé pour cette date");
        return;
    }

    // Récupérer les comptes nécessaires
    const accounts = await prisma.account.findMany({
        where: {
            companyId: invoice.companyId,
            code: {
                in: ["411000", "701000", "443100"], // Clients, Ventes, TVA collectée
            },
        },
    });

    type AccountRecord = { id: string; code: string };
    const clientAccount = accounts.find((a: AccountRecord) => a.code === "411000");
    const salesAccount = accounts.find((a: AccountRecord) => a.code === "701000");
    const tvaAccount = accounts.find((a: AccountRecord) => a.code === "443100");

    if (!clientAccount || !salesAccount || !tvaAccount) {
        console.warn("Comptes comptables manquants pour les écritures");
        return;
    }

    const totalHT = typeof invoice.totalHT === 'number' ? invoice.totalHT : invoice.totalHT.toNumber();
    const totalTVA = typeof invoice.totalTVA === 'number' ? invoice.totalTVA : invoice.totalTVA.toNumber();
    const totalTTC = typeof invoice.totalTTC === 'number' ? invoice.totalTTC : invoice.totalTTC.toNumber();

    // Créer l'écriture comptable
    await prisma.journalEntry.create({
        data: {
            fiscalYearId: fiscalYear.id,
            entryDate: invoice.issueDate,
            reference: invoice.number,
            description: `Facture client ${invoice.number}`,
            journalType: "SALES",
            isValidated: true,
            lines: {
                create: [
                    // Débit compte client (411)
                    {
                        accountId: clientAccount.id,
                        debit: totalTTC,
                        credit: 0,
                        label: "Client - Facture " + invoice.number,
                    },
                    // Crédit compte ventes (701)
                    {
                        accountId: salesAccount.id,
                        debit: 0,
                        credit: totalHT,
                        label: "Ventes - Facture " + invoice.number,
                    },
                    // Crédit TVA collectée (443)
                    {
                        accountId: tvaAccount.id,
                        debit: 0,
                        credit: totalTVA,
                        label: "TVA collectée - Facture " + invoice.number,
                    },
                ],
            },
        },
    });
}
