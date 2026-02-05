import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Schéma de validation pour la création/mise à jour d'un client
const clientSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    ifu: z.string().optional().nullable(),
    rccm: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email("Format d'email invalide").optional().nullable(),
    contact: z.string().optional().nullable(),
    paymentTermDays: z.number().min(0).max(365).default(30),
});

// GET - Liste des clients
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const isActive = searchParams.get("isActive");

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        const where = {
            companyId,
            ...(isActive !== null && { isActive: isActive === "true" }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                    { contact: { contains: search, mode: "insensitive" as const } },
                    { ifu: { contains: search, mode: "insensitive" as const } },
                ],
            }),
        };

        const [clients, total] = await Promise.all([
            prisma.client.findMany({
                where,
                include: {
                    _count: {
                        select: { invoices: true },
                    },
                    invoices: {
                        select: { totalTTC: true },
                        where: { status: { not: "CANCELLED" } },
                    },
                },
                orderBy: { name: "asc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.client.count({ where }),
        ]);

        // Calculer le CA total par client
        const clientsWithRevenue = clients.map((client: typeof clients[0]) => ({
            ...client,
            invoicesCount: client._count.invoices,
            totalRevenue: client.invoices.reduce(
                (sum: number, inv: { totalTTC: unknown }) => sum + Number(inv.totalTTC),
                0
            ),
            invoices: undefined,
            _count: undefined,
        }));

        return NextResponse.json({
            clients: clientsWithRevenue,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des clients:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des clients" },
            { status: 500 }
        );
    }
}

// POST - Créer un nouveau client
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { companyId, ...data } = body;

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        const validatedData = clientSchema.parse(data);

        // Vérifier si un client avec le même IFU existe déjà
        if (validatedData.ifu) {
            const existingClient = await prisma.client.findFirst({
                where: { companyId, ifu: validatedData.ifu },
            });

            if (existingClient) {
                return NextResponse.json(
                    { error: "Un client avec cet IFU existe déjà" },
                    { status: 400 }
                );
            }
        }

        const client = await prisma.client.create({
            data: {
                ...validatedData,
                companyId,
            },
        });

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        console.error("Erreur lors de la création du client:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Erreur lors de la création du client" },
            { status: 500 }
        );
    }
}
