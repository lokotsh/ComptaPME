import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const transactionSchema = z.object({
    date: z.string(),
    label: z.string(),
    amount: z.number(),
    reference: z.string().optional(),
});

const importSchema = z.object({
    bankAccountId: z.string(),
    transactions: z.array(transactionSchema),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = importSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Données invalides", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { bankAccountId, transactions } = validation.data;

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

        // Charger les règles de matching
        const rules = await prisma.bankMatchingRule.findMany({
            where: {
                companyId: account.companyId,
                isActive: true
            },
            orderBy: { priority: 'desc' }
        });

        let totalAmount = 0;
        let importedCount = 0;

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            for (const t of transactions) {
                // Conversion date format DD/MM/YYYY ou YYYY-MM-DD
                let dateObj: Date;
                if (t.date.includes("/")) {
                    const [day, month, year] = t.date.split("/");
                    dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                } else {
                    dateObj = new Date(t.date);
                }

                // Application des règles
                let assignedAccountId = null;
                for (const rule of rules) {
                    let match = true;
                    // Condition Libellé
                    if (rule.labelContains && !t.label.toLowerCase().includes(rule.labelContains.toLowerCase())) {
                        match = false;
                    }
                    // Condition Montant
                    if (match) {
                        const amount = Math.abs(t.amount); // Comparaison en valeur absolue souvent plus utile? Ou signé? DB stores signed. 
                        // Assuming rules apply to magnitude or exact value. 
                        // Let's use exact value from import schema (number).
                        // Rules are Decimal.
                        if (rule.amountMin && t.amount < Number(rule.amountMin)) match = false;
                        if (rule.amountMax && t.amount > Number(rule.amountMax)) match = false;
                        if (rule.amountEquals && t.amount !== Number(rule.amountEquals)) match = false;
                    }

                    if (match) {
                        assignedAccountId = rule.assignAccountId;
                        break; // Première règle prioritaire gagne
                    }
                }

                await tx.bankTransaction.create({
                    data: {
                        bankAccountId,
                        transactionDate: dateObj,
                        label: t.label,
                        amount: t.amount,
                        reference: t.reference,
                        isReconciled: false,
                        importedAt: new Date(),
                        assignedAccountId, // Champ ajouté
                    }
                });

                totalAmount += t.amount;
                importedCount++;
            }

            // Mettre à jour le solde du compte
            await tx.bankAccount.update({
                where: { id: bankAccountId },
                data: {
                    currentBalance: { increment: totalAmount }
                }
            });
        });

        // Relancer l'auto-matching pour les nouvelles transactions
        // Idéalement en tâche de fond ou asynchrone, mais ici simplifié
        // On peut appeler une fonction partagée ou laisser l'utilisateur le faire via UI

        return NextResponse.json({
            success: true,
            count: importedCount,
            newBalance: Number(account.currentBalance) + totalAmount
        });

    } catch (error) {
        console.error("Erreur import:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de l'import" },
            { status: 500 }
        );
    }
}
