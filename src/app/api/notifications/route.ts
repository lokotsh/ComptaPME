import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import prisma from "@/lib/prisma";

// GET - Récupérer les notifications de l'utilisateur
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                companyId: session.user.companyId,
                OR: [
                    { userId: session.user.id },
                    { userId: null } // Notifications globales admin/company
                ],
                isRead: false
            },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST - Marquer comme lues
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { ids } = body; // Array of IDs

        if (ids && Array.isArray(ids)) {
            await prisma.notification.updateMany({
                where: {
                    id: { in: ids },
                    // Sécurité: vérifier que la notif appartient au user ou est globale
                    companyId: session.user.companyId,
                    OR: [
                        { userId: session.user.id },
                        { userId: null }
                    ]
                },
                data: { isRead: true }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
