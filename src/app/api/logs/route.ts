import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin should see logs? Or maybe Accountant too. 
    // Let's assume ADMIN only for now based on typical requirements, or check role.
    if (session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const type = searchParams.get("type");

        const where: Record<string, string> = { companyId: session.user.companyId };
        if (type && type !== 'ALL') where.entityType = type;

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        return NextResponse.json(logs);
    } catch {
        return NextResponse.json({ error: "Erreur chargement logs" }, { status: 500 });
    }
}
