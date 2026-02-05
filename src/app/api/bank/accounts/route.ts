import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createAccountSchema = z.object({
    name: z.string().min(1, "Le nom du compte est requis"),
    bankName: z.string().min(1, "Le nom de la banque est requis"),
    accountNumber: z.string().optional(),
    currency: z.string().default("XOF"),
    initialBalance: z.number().default(0),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        const accounts = await prisma.bankAccount.findMany({
            where: {
                companyId,
                isActive: true,
            },
            include: {
                _count: {
                    select: { transactions: { where: { isReconciled: false } } }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        const formattedAccounts = accounts.map(account => ({
            id: account.id,
            name: account.name,
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            currency: account.currency,
            currentBalance: Number(account.currentBalance),
            pendingReconciliation: account._count.transactions,
            lastSync: account.updatedAt,
            isActive: account.isActive,
        }));

        return NextResponse.json(formattedAccounts);
    } catch (error) {
        console.error("Erreur récupération comptes:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { companyId, ...data } = body;

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        const validation = createAccountSchema.safeParse(data);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const account = await prisma.bankAccount.create({
            data: {
                companyId,
                ...validation.data,
                currentBalance: validation.data.initialBalance,
            },
        });

        return NextResponse.json(account, { status: 201 });
    } catch (error) {
        console.error("Erreur création compte:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
