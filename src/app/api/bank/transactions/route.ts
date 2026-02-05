import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createTransactionSchema = z.object({
    bankAccountId: z.string().min(1, "Compte bancaire requis"),
    transactionDate: z.string().or(z.date()),
    amount: z.number(), // Positif ou négatif
    label: z.string().min(1, "Libellé requis"),
    reference: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");
        const bankAccountId = searchParams.get("bankAccountId");
        const limit = parseInt(searchParams.get("limit") || "50");

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        // Si bankAccountId est fourni, vérifier qu'il appartient à la company
        if (bankAccountId) {
            const account = await prisma.bankAccount.findUnique({
                where: { id: bankAccountId, companyId },
            });
            if (!account) {
                return NextResponse.json(
                    { error: "Compte bancaire introuvable" },
                    { status: 404 }
                );
            }
        }

        const where = {
            bankAccount: {
                companyId,
                ...(bankAccountId && { id: bankAccountId }),
            },
        };

        const transactions = await prisma.bankTransaction.findMany({
            where,
            orderBy: { transactionDate: "desc" },
            take: limit,
            include: {
                bankAccount: {
                    select: { name: true, bankName: true, currency: true }
                }
            }
        });

        const formattedTransactions = transactions.map(tx => ({
            id: tx.id,
            accountId: tx.bankAccountId,
            accountName: tx.bankAccount.name,
            date: tx.transactionDate,
            label: tx.label,
            amount: Number(tx.amount),
            type: Number(tx.amount) >= 0 ? "credit" : "debit",
            reconciled: tx.isReconciled,
            reference: tx.reference,
            currency: tx.bankAccount.currency,
        }));

        return NextResponse.json(formattedTransactions);
    } catch (error) {
        console.error("Erreur récupération transactions:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // Validation basique
        const validation = createTransactionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { bankAccountId, transactionDate, amount, label, reference } = validation.data;

        // Vérifier le compte
        const account = await prisma.bankAccount.findUnique({
            where: { id: bankAccountId },
        });

        if (!account) {
            return NextResponse.json(
                { error: "Compte bancaire introuvable" },
                { status: 404 }
            );
        }

        // Transaction DB : Créer la transaction ET mettre à jour le solde du compte
        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.bankTransaction.create({
                data: {
                    bankAccountId,
                    transactionDate: new Date(transactionDate),
                    amount,
                    label,
                    reference,
                    isReconciled: false,
                },
            });

            // Mettre à jour le solde du compte
            await tx.bankAccount.update({
                where: { id: bankAccountId },
                data: {
                    currentBalance: { increment: amount }
                }
            });

            return transaction;
        });

        // Match automatique simple (Montant exact + Référence optionnelle)
        // Ceci est une version simplifiée. Dans un vrai système, on utiliserait un algorithme plus robuste.
        try {
            // 1. Détecter le type (Débit = Achat, Crédit = Vente)
            const type = amount < 0 ? "supplier" : "client";
            const absAmount = Math.abs(amount);

            let matchedId = null;

            if (type === "client") {
                // Chercher une facture client non payée avec ce montant
                // Et idéalement dont le numéro est dans le libellé
                const candidateInvoices = await prisma.invoice.findMany({
                    where: {
                        companyId: account.companyId,
                        status: { in: ["SENT", "PARTIALLY_PAID"] }, // Factures envoyées ou partiellement payées
                        totalTTC: absAmount, // Correspondance exacte montant (simplification)
                    },
                });

                // Si une seule facture correspond au montant, on match (confiance moyenne)
                // Si le libellé contient le numéro, on match (confiance haute)
                for (const inv of candidateInvoices) {
                    if (label.includes(inv.number) || candidateInvoices.length === 1) {
                        matchedId = inv.id;
                        break;
                    }
                }
            } else {
                // Chercher une facture fournisseur
                const candidateInvoices = await prisma.supplierInvoice.findMany({
                    where: {
                        companyId: account.companyId,
                        status: { in: ["PENDING", "APPROVED", "PARTIALLY_PAID"] },
                        totalTTC: absAmount,
                    }
                });

                for (const inv of candidateInvoices) {
                    if (label.includes(inv.number) || candidateInvoices.length === 1) {
                        matchedId = inv.id;
                        break;
                    }
                }
            }

            if (matchedId) {
                await prisma.bankTransaction.update({
                    where: { id: result.id },
                    data: {
                        matchedInvoiceId: matchedId,
                        matchedType: type,
                        // On ne marque pas reconciled: true tout de suite, l'utilisateur doit valider
                        // Sauf si on est sûr à 100% (ex: règles strictes)
                    }
                });
            }

        } catch (matchError) {
            console.error("Erreur auto-matching:", matchError);
            // On ne bloque pas la réponse si le matching échoue
        }

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error("Erreur création transaction:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
