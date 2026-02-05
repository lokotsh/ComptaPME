import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import prisma from "@/lib/prisma";
import { verify } from "otplib";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { code } = await request.json();

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user || !user.twoFactorSecret) {
            return NextResponse.json({ error: "Configuration invalide" }, { status: 400 });
        }

        const { valid } = await verify({
            token: code,
            secret: user.twoFactorSecret
        });

        if (!valid) {
            return NextResponse.json({ error: "Code invalide" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorEnabled: true }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("2FA Confirm Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
