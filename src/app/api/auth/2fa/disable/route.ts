import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { password } = await request.json();

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("2FA Disable Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
