import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Schéma de validation pour la création/mise à jour d'un fournisseur
const supplierSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    ifu: z.string().optional().nullable(),
    rccm: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email("Format d'email invalide").optional().nullable(),
    contact: z.string().optional().nullable(),
    paymentTermDays: z.number().min(0).max(365).default(30),
});

// GET - Liste des fournisseurs
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
                ],
            }),
        };

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                include: {
                    _count: {
                        select: { invoices: true },
                    },
                    invoices: {
                        select: { totalTTC: true, status: true },
                        where: { status: { not: "CANCELLED" } },
                    },
                },
                orderBy: { name: "asc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.supplier.count({ where }),
        ]);

        // Calculer les totaux par fournisseur
        type SupplierInvoice = { totalTTC: unknown; status: string };
        const suppliersWithStats = suppliers.map((supplier: typeof suppliers[0]) => ({
            ...supplier,
            invoicesCount: supplier._count.invoices,
            totalPurchases: supplier.invoices.reduce(
                (sum: number, inv: SupplierInvoice) => sum + Number(inv.totalTTC),
                0
            ),
            pendingAmount: supplier.invoices
                .filter((inv: SupplierInvoice) => ["PENDING", "APPROVED"].includes(inv.status))
                .reduce((sum: number, inv: SupplierInvoice) => sum + Number(inv.totalTTC), 0),
            invoices: undefined,
            _count: undefined,
        }));

        return NextResponse.json({
            suppliers: suppliersWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des fournisseurs:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des fournisseurs" },
            { status: 500 }
        );
    }
}

// POST - Créer un nouveau fournisseur
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

        const validatedData = supplierSchema.parse(data);

        const supplier = await prisma.supplier.create({
            data: {
                ...validatedData,
                companyId,
            },
        });

        return NextResponse.json(supplier, { status: 201 });
    } catch (error) {
        console.error("Erreur lors de la création du fournisseur:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Erreur lors de la création du fournisseur" },
            { status: 500 }
        );
    }
}
