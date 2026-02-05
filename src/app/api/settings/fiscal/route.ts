import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) return NextResponse.json({ error: "companyId requis" }, { status: 400 });

        const settings = await prisma.companySettings.findUnique({
            where: { companyId }
        });

        // Return defaults if no settings found
        if (!settings) {
            return NextResponse.json({
                taxSystem: "REEL",
                tvaEnabled: true,
                cnssEmployerRate: 15.4,
                cnssEmployeeRate: 3.6
            });
        }

        return NextResponse.json(settings);

    } catch (error) {
        console.error("Erreur settings:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) return NextResponse.json({ error: "companyId requis" }, { status: 400 });

        const settings = await prisma.companySettings.upsert({
            where: { companyId },
            update: {
                taxSystem: body.taxSystem,
                tvaEnabled: body.tvaEnabled,
                cnssEmployerRate: body.cnssEmployerRate,
                cnssEmployeeRate: body.cnssEmployeeRate,
                isMicroEnterprise: body.taxSystem === 'TPS'
            },
            create: {
                companyId,
                taxSystem: body.taxSystem,
                tvaEnabled: body.tvaEnabled,
                cnssEmployerRate: body.cnssEmployerRate,
                cnssEmployeeRate: body.cnssEmployeeRate,
                isMicroEnterprise: body.taxSystem === 'TPS'
            }
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Erreur sauvegarde settings:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
