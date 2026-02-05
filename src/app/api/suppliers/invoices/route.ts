import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Schema de validation pour la création d'une facture fournisseur
const invoiceLineSchema = z.object({
    description: z.string().min(1, "La description est requise"),
    quantity: z.number().min(0.001, "La quantité doit être positive"),
    unitPriceHT: z.number().min(0, "Le prix unitaire doit être positif"),
    tvaRate: z.number().min(0).default(18), // 18% par défaut au Bénin
    accountId: z.string().optional(),
});

const createInvoiceSchema = z.object({
    supplierId: z.string().min(1, "Le fournisseur est requis"),
    number: z.string().min(1, "Le numéro de facture est requis"),
    issueDate: z.string().transform((str) => new Date(str)),
    dueDate: z.string().transform((str) => new Date(str)),
    receiptDate: z.string().transform((str) => new Date(str)),
    notes: z.string().optional(),
    lines: z.array(invoiceLineSchema).min(1, "Au moins une ligne est requise"),
});


// GET - Liste des factures fournisseurs
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status");

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        const where = {
            companyId,
            ...(status && { status: status.toUpperCase() }),
            ...(search && {
                OR: [
                    { number: { contains: search } },
                    { supplier: { name: { contains: search } } },
                ],
            }),
        };

        const [invoices, total] = await Promise.all([
            prisma.supplierInvoice.findMany({
                where,
                include: {
                    supplier: {
                        select: { name: true },
                    },
                    _count: {
                        select: { documents: true },
                    },
                },
                orderBy: { issueDate: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.supplierInvoice.count({ where }),
        ]);

        const formattedInvoices = invoices.map((invoice) => ({
            id: invoice.id,
            number: invoice.number,
            supplier: invoice.supplier.name,
            receiptDate: invoice.receiptDate,
            dueDate: invoice.dueDate,
            totalTTC: Number(invoice.totalTTC),
            amountPaid: Number(invoice.amountPaid),
            status: invoice.status.toLowerCase(),
            hasDocument: invoice._count.documents > 0,
        }));

        return NextResponse.json({
            invoices: formattedInvoices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des factures fournisseurs:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des factures fournisseurs" },
            { status: 500 }
        );
    }
}

// POST - Créer une facture fournisseur
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

        const validatedData = createInvoiceSchema.parse(data);

        // Vérifier unicité du numéro pour ce fournisseur
        const existingInvoice = await prisma.supplierInvoice.findFirst({
            where: {
                companyId,
                supplierId: validatedData.supplierId,
                number: validatedData.number,
            },
        });

        if (existingInvoice) {
            return NextResponse.json(
                { error: "Ce numéro de facture existe déjà pour ce fournisseur" },
                { status: 400 }
            );
        }

        // Calcul des totaux
        let totalHT = 0;
        let totalTVA = 0;

        const linesWithTotals = validatedData.lines.map(line => {
            const lineHT = line.quantity * line.unitPriceHT;
            const lineTVA = lineHT * (line.tvaRate / 100);

            totalHT += lineHT;
            totalTVA += lineTVA;

            return {
                ...line,
                totalHT: lineHT,
                totalTVA: lineTVA,
                totalTTC: lineHT + lineTVA,
            };
        });

        const totalTTC = totalHT + totalTVA;

        // Transaction DB
        const invoice = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Créer la facture
            const newInvoice = await tx.supplierInvoice.create({
                data: {
                    companyId,
                    supplierId: validatedData.supplierId,
                    number: validatedData.number,
                    issueDate: validatedData.issueDate,
                    dueDate: validatedData.dueDate,
                    receiptDate: validatedData.receiptDate,
                    totalHT: totalHT,
                    totalTVA: totalTVA,
                    totalTTC: totalTTC,
                    status: "PENDING",
                    notes: validatedData.notes,
                    lines: {
                        create: linesWithTotals.map((line) => ({
                            description: line.description,
                            quantity: line.quantity,
                            unitPriceHT: line.unitPriceHT,
                            tvaRate: line.tvaRate,
                            totalHT: line.totalHT,
                            totalTVA: line.totalTVA,
                            totalTTC: line.totalTTC,
                            accountId: line.accountId,
                        }))
                    }
                },
                include: {
                    lines: true
                }
            });

            return newInvoice;
        });

        return NextResponse.json(invoice, { status: 201 });

    } catch (error) {
        console.error("Erreur création facture fournisseur:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Erreur lors de la création de la facture", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
