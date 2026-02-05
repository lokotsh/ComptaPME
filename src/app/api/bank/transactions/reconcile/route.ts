import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema de validation
const reconcileSchema = z.object({
    transactionId: z.string().min(1),
    invoiceId: z.string().min(1),
    invoiceType: z.enum(["client", "supplier"]),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = reconcileSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { transactionId, invoiceId, invoiceType } = validation.data;

        // 1. Récupérer la transaction
        const transaction = await prisma.bankTransaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) {
            return NextResponse.json(
                { error: "Transaction introuvable" },
                { status: 404 }
            );
        }

        if (transaction.isReconciled) {
            return NextResponse.json(
                { error: "Transaction déjà rapprochée" },
                { status: 400 }
            );
        }

        // 2. Traitement selon le type (Client ou Fournisseur)
        // Utilisation d'une transaction Prisma pour garantir l'atomicité
        await prisma.$transaction(async (tx) => {

            // A. Mettre à jour la transaction bancaire
            await tx.bankTransaction.update({
                where: { id: transactionId },
                data: {
                    isReconciled: true,
                    reconciledAt: new Date(),
                    matchedInvoiceId: invoiceId,
                    matchedType: invoiceType,
                }
            });

            // B. Créer le paiement et mettre à jour la facture
            const absAmount = Math.abs(Number(transaction.amount));

            if (invoiceType === "client") {
                // Facture Client
                const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
                if (!invoice) throw new Error("Facture client introuvable");

                await tx.payment.create({
                    data: {
                        invoiceId,
                        amount: absAmount,
                        paymentDate: transaction.transactionDate,
                        paymentMethod: "BANK_TRANSFER", // Par défaut car via banque
                        reference: transaction.reference || transaction.label,
                    }
                });

                // Calculer nouveau solde
                const newAmountPaid = Number(invoice.amountPaid) + absAmount;
                const isPaid = newAmountPaid >= Number(invoice.totalTTC);

                await tx.invoice.update({
                    where: { id: invoiceId },
                    data: {
                        amountPaid: newAmountPaid,
                        status: isPaid ? "PAID" : "PARTIALLY_PAID"
                    }
                });

            } else {
                // Facture Fournisseur
                const invoice = await tx.supplierInvoice.findUnique({ where: { id: invoiceId } });
                if (!invoice) throw new Error("Facture fournisseur introuvable");

                await tx.supplierPayment.create({
                    data: {
                        invoiceId,
                        bankAccountId: transaction.bankAccountId,
                        amount: absAmount,
                        paymentDate: transaction.transactionDate,
                        paymentMethod: "BANK_TRANSFER",
                        reference: transaction.reference || transaction.label,
                    }
                });

                // Calculer nouveau solde
                const newAmountPaid = Number(invoice.amountPaid) + absAmount;
                const isPaid = newAmountPaid >= Number(invoice.totalTTC);

                await tx.supplierInvoice.update({
                    where: { id: invoiceId },
                    data: {
                        amountPaid: newAmountPaid,
                        status: isPaid ? "PAID" : "PARTIALLY_PAID"
                    }
                });
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Erreur réconciliation:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Erreur serveur" },
            { status: 500 }
        );
    }
}
