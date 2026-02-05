import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json({ error: "companyId requis" }, { status: 400 });
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const startDate = startOfMonth(now);
        const endDate = endOfMonth(now);

        // 1. Calculate Collected TVA (Ventes)
        // Invoices issued/paid in this month depending on accounting rules (usually issued)
        // We'll calculate based on Invoice Lines where account is marked as collectable or just sum totalTVA

        const invoices = await prisma.invoice.findMany({
            where: {
                companyId,
                issueDate: {
                    gte: startDate,
                    lte: endDate
                },
                status: {
                    notIn: ['DRAFT', 'CANCELLED']
                }
            },
            select: {
                totalTVA: true
            }
        });

        const collected = invoices.reduce((sum, inv) => sum + Number(inv.totalTVA), 0);

        // 2. Calculate Deductible TVA (Achats)
        const supplierInvoices = await prisma.supplierInvoice.findMany({
            where: {
                companyId,
                issueDate: {
                    gte: startDate,
                    lte: endDate
                },
                status: {
                    not: 'CANCELLED'
                },
                tvaDeductible: true
            },
            select: {
                totalTVA: true
            }
        });

        const deductible = supplierInvoices.reduce((sum, inv) => sum + Number(inv.totalTVA), 0);

        // 3. Get History (Last 3 months)
        const history = [];
        for (let i = 1; i <= 3; i++) {
            const date = subMonths(now, i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            // Check if declaration exists
            const declaration = await prisma.tvaDeclaration.findFirst({
                where: {
                    companyId,
                    periodStart: {
                        gte: start,
                        lte: end
                    }
                }
            });

            if (declaration) {
                history.push({
                    period: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                    collected: Number(declaration.salesTVA),
                    deductible: Number(declaration.purchasesTVA),
                    balance: Number(declaration.tvaDue),
                    status: declaration.status.toLowerCase()
                });
            } else {
                // Approximate from invoices if no declaration
                // (Skipping for now to keep it simple, assume history is made of declarations)
            }
        }

        // Stats Year to Date (YTD)
        // For simplicity, just finding all validated declarations this year
        const yearStart = new Date(currentYear, 0, 1);
        const declarations = await prisma.tvaDeclaration.findMany({
            where: {
                companyId,
                periodStart: {
                    gte: yearStart
                }
            }
        });

        const stats = {
            collectedYTD: declarations.reduce((sum, d) => sum + Number(d.salesTVA), 0) + collected,
            deductibleYTD: declarations.reduce((sum, d) => sum + Number(d.purchasesTVA), 0) + deductible,
            paidYTD: declarations
                .filter(d => d.status === 'PAID')
                .reduce((sum, d) => sum + Number(d.tvaDue), 0)
        };

        return NextResponse.json({
            currentPeriod: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                dueDate: new Date(currentYear, currentMonth + 1, 20).toISOString(), // 20th of next month
                collected,
                deductible,
                balance: collected - deductible
            },
            history,
            stats
        });

    } catch (error) {
        console.error("Erreur calcul TVA:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
