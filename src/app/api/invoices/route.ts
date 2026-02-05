import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { MecefService } from "@/lib/mecef";

const Decimal = Prisma.Decimal;
const mecefService = MecefService.getInstance();

// Schéma pour les lignes de facture
const invoiceLineSchema = z.object({
    description: z.string().min(1, "La description est requise"),
    quantity: z.number().positive("La quantité doit être positive"),
    unitPriceHT: z.number().min(0, "Le prix unitaire doit être positif"),
    tvaRate: z.number().min(0).max(100).default(18),
    discountPercent: z.number().min(0).max(100).default(0),
    tvaGroup: z.enum(["A", "B", "C", "D", "E", "F"]).optional().default("B"),
    accountId: z.string().optional().nullable(),
});

// Schéma pour la création de facture
const createInvoiceSchema = z.object({
    clientId: z.string().min(1, "Le client est requis"),
    type: z.enum(["QUOTE", "ORDER", "INVOICE", "CREDIT_NOTE"]).default("INVOICE"),
    status: z.enum(["DRAFT", "SENT", "PAID"]).optional(),
    issueDate: z.string().transform((str) => new Date(str)),
    dueDate: z.string().transform((str) => new Date(str)),
    notes: z.string().optional().nullable(),
    legalMentions: z.string().optional().nullable(),
    mecefType: z.enum(["FV", "FA"]).optional().default("FV"),
    lines: z.array(invoiceLineSchema).min(1, "Au moins une ligne est requise"),
    originalInvoiceId: z.string().optional().nullable(),
});

// Calculs des montants d'une ligne
function calculateLineAmounts(line: {
    quantity: number;
    unitPriceHT: number;
    tvaRate: number;
    discountPercent: number;
}) {
    const baseHT = line.quantity * line.unitPriceHT;
    const discount = baseHT * (line.discountPercent / 100);
    const totalHT = baseHT - discount;
    const totalTVA = totalHT * (line.tvaRate / 100);
    const totalTTC = totalHT + totalTVA;

    return { totalHT, totalTVA, totalTTC };
}

// Générer le prochain numéro de facture
async function generateInvoiceNumber(
    companyId: string,
    type: string
): Promise<string> {
    const settings = await prisma.companySettings.findUnique({
        where: { companyId },
    });

    const prefix = type === "QUOTE"
        ? (settings?.quotePrefix || "DEV")
        : (settings?.invoicePrefix || "FAC");

    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
        where: {
            companyId,
            series: prefix,
            number: { startsWith: `${prefix}-${year}` },
        },
        orderBy: { number: "desc" },
    });

    let nextNumber = 1;
    if (lastInvoice) {
        const match = lastInvoice.number.match(/-(\d+)$/);
        if (match) {
            nextNumber = parseInt(match[1]) + 1;
        }
    }

    return `${prefix}-${year}-${nextNumber.toString().padStart(3, "0")}`;
}

// GET - Liste des factures
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");
        const type = searchParams.get("type");
        const clientId = searchParams.get("clientId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        const where = {
            companyId,
            ...(status && { status: status as "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" }),
            ...(type && { type: type as "QUOTE" | "ORDER" | "INVOICE" | "CREDIT_NOTE" }),
            ...(clientId && { clientId }),
            ...(search && {
                OR: [
                    { number: { contains: search, mode: "insensitive" as const } },
                    { client: { name: { contains: search, mode: "insensitive" as const } } },
                ],
            }),
        };

        const [invoices, total, stats] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: {
                    client: {
                        select: { id: true, name: true, email: true },
                    },
                    _count: {
                        select: { lines: true, payments: true },
                    },
                },
                orderBy: { issueDate: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.invoice.count({ where }),
            // Statistiques
            prisma.invoice.groupBy({
                by: ["status"],
                where: { companyId },
                _sum: { totalTTC: true },
                _count: true,
            }),
        ]);

        // Formater les statistiques
        const formattedStats = {
            total: 0,
            draft: 0,
            sent: 0,
            paid: 0,
            overdue: 0,
            count: {
                total: 0,
                draft: 0,
                sent: 0,
                paid: 0,
                overdue: 0,
            },
        };

        type InvoiceStat = { status: string; _sum: { totalTTC: unknown }; _count: number };
        stats.forEach((s: InvoiceStat) => {
            const amount = Number(s._sum.totalTTC || 0);
            formattedStats.total += amount;
            formattedStats.count.total += s._count;

            switch (s.status) {
                case "DRAFT":
                    formattedStats.draft = amount;
                    formattedStats.count.draft = s._count;
                    break;
                case "SENT":
                case "PARTIALLY_PAID":
                    formattedStats.sent += amount;
                    formattedStats.count.sent += s._count;
                    break;
                case "PAID":
                    formattedStats.paid = amount;
                    formattedStats.count.paid = s._count;
                    break;
                case "OVERDUE":
                    formattedStats.overdue = amount;
                    formattedStats.count.overdue = s._count;
                    break;
            }
        });

        return NextResponse.json({
            invoices,
            stats: formattedStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des factures:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des factures" },
            { status: 500 }
        );
    }
}

// POST - Créer une nouvelle facture
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { companyId, createdById, ...data } = body;

        if (!companyId || !createdById) {
            return NextResponse.json(
                { error: "companyId et createdById sont requis" },
                { status: 400 }
            );
        }

        const validatedData = createInvoiceSchema.parse(data);

        // Fetch company details for IFU
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { ifu: true, name: true }
        });

        if (!company) throw new Error("Entreprise non trouvée");

        // Générer le numéro de facture
        const number = await generateInvoiceNumber(companyId, validatedData.type);

        // Calculer les totaux
        let totalHT = 0;
        let totalTVA = 0;
        let totalTTC = 0;

        const linesWithAmounts = validatedData.lines.map((line, index) => {
            const amounts = calculateLineAmounts(line);
            totalHT += amounts.totalHT;
            totalTVA += amounts.totalTVA;
            totalTTC += amounts.totalTTC;

            return {
                description: line.description,
                quantity: new Decimal(line.quantity),
                unitPriceHT: new Decimal(line.unitPriceHT),
                tvaRate: new Decimal(line.tvaRate),
                tvaGroup: line.tvaGroup,
                discountPercent: new Decimal(line.discountPercent),
                totalHT: new Decimal(amounts.totalHT),
                totalTVA: new Decimal(amounts.totalTVA),
                totalTTC: new Decimal(amounts.totalTTC),
                position: index,
                accountId: line.accountId,
            };
        });

        // MECeF Certification
        let mecefData = null;
        // On certifie si ce n'est pas un brouillon ou si on force la certification (a voir selon besoin user)
        // Généralement on ne certifie que les factures finalisées (SENT/PAID)
        const shouldCertify = validatedData.status !== "DRAFT" && validatedData.type !== "QUOTE";

        if (shouldCertify) {
            const client = await prisma.client.findUnique({
                where: { id: validatedData.clientId },
                select: { ifu: true, name: true }
            });

            mecefData = await mecefService.certify({
                companyIfu: company.ifu || "0000000000000",
                items: validatedData.lines.map(l => ({
                    name: l.description,
                    quantity: l.quantity,
                    unitPrice: l.unitPriceHT,
                    tvaGroup: l.tvaGroup
                })),
                totalAmount: totalTTC,
                clientIfu: client?.ifu || undefined,
                clientName: client?.name,
                type: validatedData.mecefType as any || "FV",
                operatorName: "System" // Idéalement le nom de l'user connecte
            });
        }

        // Créer la facture avec ses lignes
        const invoice = await prisma.invoice.create({
            data: {
                companyId,
                clientId: validatedData.clientId,
                createdById,
                number,
                series: validatedData.type === "QUOTE" ? "DEV" : "FAC",
                type: validatedData.type,
                issueDate: validatedData.issueDate,
                dueDate: validatedData.dueDate,
                totalHT: new Decimal(totalHT),
                totalTVA: new Decimal(totalTVA),
                totalTTC: new Decimal(totalTTC),
                status: validatedData.status || "DRAFT",
                notes: validatedData.notes,
                legalMentions: validatedData.legalMentions,

                // Champs MECeF
                mecefNim: mecefData?.nim,
                mecefCounters: mecefData?.counters,
                mecefDtc: mecefData?.dtc,
                mecefQrCode: mecefData?.qrCode,
                mecefSignature: mecefData?.signature,
                mecefType: validatedData.mecefType,
                mecefStatus: mecefData ? "CERTIFIED" : "PENDING",

                originalInvoiceId: validatedData.originalInvoiceId,

                lines: {
                    create: linesWithAmounts,
                },
            },
            include: {
                client: true,
                lines: true,
            },
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        console.error("Erreur lors de la création de la facture:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Erreur lors de la création de la facture" },
            { status: 500 }
        );
    }
}
