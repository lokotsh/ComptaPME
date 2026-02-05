import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const updateClientSchema = z.object({
    name: z.string().min(2).optional(),
    ifu: z.string().optional().nullable(),
    rccm: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    contact: z.string().optional().nullable(),
    paymentTermDays: z.number().min(0).max(365).optional(),
    isActive: z.boolean().optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Récupérer un client par ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                invoices: {
                    orderBy: { issueDate: "desc" },
                    take: 10,
                    select: {
                        id: true,
                        number: true,
                        issueDate: true,
                        dueDate: true,
                        totalTTC: true,
                        status: true,
                    },
                },
            },
        });

        if (!client) {
            return NextResponse.json(
                { error: "Client introuvable" },
                { status: 404 }
            );
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error("Erreur lors de la récupération du client:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération du client" },
            { status: 500 }
        );
    }
}

// PUT - Mettre à jour un client
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const validatedData = updateClientSchema.parse(body);

        const client = await prisma.client.update({
            where: { id },
            data: validatedData,
        });

        return NextResponse.json(client);
    } catch (error) {
        console.error("Erreur lors de la mise à jour du client:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Erreur lors de la mise à jour du client" },
            { status: 500 }
        );
    }
}

// DELETE - Supprimer un client (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Vérifier si le client a des factures
        const client = await prisma.client.findUnique({
            where: { id },
            include: { _count: { select: { invoices: true } } },
        });

        if (!client) {
            return NextResponse.json(
                { error: "Client introuvable" },
                { status: 404 }
            );
        }

        if (client._count.invoices > 0) {
            // Soft delete - désactiver le client
            await prisma.client.update({
                where: { id },
                data: { isActive: false },
            });

            return NextResponse.json({
                message: "Client désactivé (des factures sont liées)",
            });
        }

        // Hard delete si pas de factures
        await prisma.client.delete({ where: { id } });

        return NextResponse.json({ message: "Client supprimé" });
    } catch (error) {
        console.error("Erreur lors de la suppression du client:", error);
        return NextResponse.json(
            { error: "Erreur lors de la suppression du client" },
            { status: 500 }
        );
    }
}
