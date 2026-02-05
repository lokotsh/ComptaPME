import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const accounts = await prisma.account.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { code: "asc" },
        });

        // Fallback or empty list
        return NextResponse.json(accounts);
    } catch (error) {
        return NextResponse.json({ error: "Erreur chargement comptes" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const account = await prisma.account.create({
            data: {
                companyId: session.user.companyId,
                code: body.code,
                label: body.label,
                type: body.type || 'ASSET', // Default enum
            }
        });
        return NextResponse.json(account);
    } catch (error) {
        return NextResponse.json({ error: "Erreur création compte" }, { status: 500 });
    }
}
