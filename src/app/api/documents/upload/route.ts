import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const companyId = formData.get("companyId") as string;
        const refType = formData.get("refType") as string;
        const refId = formData.get("refId") as string;

        if (!file || !companyId || !refType || !refId) {
            return NextResponse.json(
                { error: "Paramètres manquants (file, companyId, refType, refId)" },
                { status: 400 }
            );
        }

        // Validation basique
        const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Format de fichier non supporté. Utilisez PDF, JPG ou PNG." },
                { status: 400 }
            );
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return NextResponse.json(
                { error: "Le fichier est trop volumineux (Max 5MB)" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // Nettoyer le nom de fichier
        const filename = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const uniqueName = `${Date.now()}-${filename}`;

        // Structure: public/uploads/companyId/year
        const date = new Date();
        const year = date.getFullYear().toString();

        // Utiliser process.cwd() pour trouver la racine du projet
        const uploadDir = path.join(process.cwd(), "public", "uploads", companyId, year);

        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, uniqueName);
        await writeFile(filePath, buffer);

        const publicPath = `/uploads/${companyId}/${year}/${uniqueName}`;

        const document = await prisma.document.create({
            data: {
                companyId,
                fileName: uniqueName,
                originalName: file.name,
                mimeType: file.type,
                size: file.size,
                path: publicPath,
                refType,
                refId,
                // Relations dynamiques
                ...(refType === "supplier_invoice" && { supplierInvoiceId: refId }),
                ...(refType === "invoice" && { invoiceId: refId }),
                ...(refType === "employee" && { employeeId: refId }),
            }
        });

        return NextResponse.json(document, { status: 201 });

    } catch (error) {
        console.error("Erreur upload:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'upload du fichier" },
            { status: 500 }
        );
    }
}
