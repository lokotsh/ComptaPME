import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import prisma from "@/lib/prisma";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Generate Secret
        const secret = generateSecret();

        // Save secret temporarily (or permanently but disabled)
        // We will save it to the user record but keep twoFactorEnabled = false until confirmed
        await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorSecret: secret }
        });

        const otpauth = generateURI({
            issuer: "ComptaPME",
            label: user.email,
            secret: secret
        });
        const qrCodeUrl = await QRCode.toDataURL(otpauth);

        return NextResponse.json({ secret, qrCodeUrl });
    } catch (error) {
        console.error("2FA Generate Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
