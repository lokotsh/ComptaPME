import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json({ error: "companyId requis" }, { status: 400 });
        }

        const compteResultatData = {
            periode: `Exercice ${new Date().getFullYear()}`,
            produits: {
                exploitation: [
                    { label: "Ventes de marchandises", n: 0, n1: 0 },
                    { label: "Prestations de services", n: 0, n1: 0 },
                    { label: "Produits accessoires", n: 0, n1: 0 },
                ],
                financiers: [
                    { label: "Intérêts perçus", n: 0, n1: 0 },
                ],
                exceptionnels: [
                    { label: "Produits exceptionnels", n: 0, n1: 0 },
                ],
            },
            charges: {
                exploitation: [
                    { label: "Achats de marchandises", n: 0, n1: 0 },
                    { label: "Variation de stocks", n: 0, n1: 0 },
                    { label: "Autres achats et charges externes", n: 0, n1: 0 },
                    { label: "Impôts et taxes", n: 0, n1: 0 },
                    { label: "Charges de personnel", n: 0, n1: 0 },
                    { label: "Dotations aux amortissements", n: 0, n1: 0 },
                ],
                financieres: [
                    { label: "Intérêts payés", n: 0, n1: 0 },
                ],
                exceptionnelles: [
                    { label: "Charges exceptionnelles", n: 0, n1: 0 },
                ],
            },
        };

        // Calculate Revenue (Ventes)
        const sales = await prisma.invoice.findMany({
            where: {
                companyId,
                status: { not: 'CANCELLED' } // Include PAID and SENT/OVERDUE as revenue accrued
            }
        });
        const totalSales = sales.reduce((sum: number, inv) => sum + Number(inv.totalHT), 0); // Use HT as revenue without TVA
        compteResultatData.produits.exploitation[0].n = totalSales; // Simplified: putting all in Goods Sales

        // Calculate Expenses (Achats) if SupplierInvoice exists
        /*
        const purchases = await prisma.supplierInvoice.findMany({
            where: {
                companyId,
                status: { not: 'CANCELLED' }
            }
        });
        const totalPurchases = purchases.reduce((sum, inv) => sum + Number(inv.totalAmount) - Number(inv.totalTVA), 0);
        compteResultatData.charges.exploitation[0].n = totalPurchases;
        */

        // Calculate Payroll Expenses
        // const payrollRuns = await prisma.payrollRun.findMany({
        //     where: { companyId }
        // });
        // Total Cost = Gross Salary + Employer CNSS (Simplified)
        // We'd need to sum Payslips actually to be precise or use payrollRun totals if stored.
        // Assuming payrollRun might have a totalCost field or similar, or we sum computed fields.
        // For MVP, leave as 0 or implement detailed sum.

        return NextResponse.json(compteResultatData);

    } catch (error) {
        console.error("Erreur récupération compte résultat:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
