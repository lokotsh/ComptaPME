import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import prisma from "@/lib/prisma";
import * as z from "zod";

const ruleSchema = z.object({
    name: z.string().min(1, "Le nom est requis"),
    labelContains: z.string().optional(),
    amountEquals: z.string().optional(), // We accept string and convert
    amountMin: z.string().optional(),
    amountMax: z.string().optional(),
    assignAccountId: z.string().optional(),
    autoReconcile: z.boolean().default(false),
    priority: z.number().default(0),
});

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const rules = await prisma.bankMatchingRule.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { priority: "desc" },
        });

        return NextResponse.json(rules);
    } catch (error) {
        return NextResponse.json({ error: "Erreur chargement règles" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const result = ruleSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const { name, labelContains, amountEquals, amountMin, amountMax, assignAccountId, autoReconcile, priority } = result.data;

        const rule = await prisma.bankMatchingRule.create({
            data: {
                companyId: session.user.companyId,
                name,
                labelContains,
                amountEquals: amountEquals ? parseFloat(amountEquals) : null,
                amountMin: amountMin ? parseFloat(amountMin) : null,
                amountMax: amountMax ? parseFloat(amountMax) : null,
                assignAccountId,
                autoReconcile,
                priority,
            },
        });

        return NextResponse.json(rule);
    } catch (error) {
        console.error("Erreur création règle:", error);
        return NextResponse.json({ error: "Erreur création règle" }, { status: 500 });
    }
}
