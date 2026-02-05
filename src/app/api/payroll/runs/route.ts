import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json({ error: "companyId requis" }, { status: 400 });
        }

        const runs = await prisma.payrollRun.findMany({
            where: {
                companyId: companyId
            },
            orderBy: {
                periodStart: 'desc'
            },
            select: {
                id: true,
                periodStart: true,
                periodEnd: true,
                status: true,
                totalNetPay: true
            }
        });

        return NextResponse.json(runs);
    } catch (error) {
        console.error("Erreur récupération périodes de paie:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
