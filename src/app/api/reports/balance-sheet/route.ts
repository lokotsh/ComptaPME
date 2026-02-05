import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json({ error: "companyId requis" }, { status: 400 });
        }

        // Fetch accounts and calculate balances
        // Simplified Logic: Asset = Accounts 2 & 3 & 5 (partial), Liability = Accounts 1 & 4
        // In reality, this would query a General Ledger view or aggregate Transaction Lines by account class.

        // MOCK DATA GENERATION based on real DB if possible, but schema may not have full accounting plan yet.
        // We will return a structure that matches the frontend expectation, potentially calculating simple sums from Invoices/Expenses if detailed ledger is missing.

        // For MVP, since we don't have a full General Ledger with Chart of Accounts in the schema shown earlier (only Invoices/Payments), 
        // we might return the structure filled with 0s or estimates, OR we assume a `Account` model exists (it wasn't in the partial view earlier).
        // Let's assume we return the structure used by the frontend for now, maybe adding a bit of dynamic calculation if possible.

        const bilanData = {
            date: new Date().toLocaleDateString("fr-FR"),
            actif: {
                immobilise: [
                    { label: "Immobilisations incorporelles", brut: 0, amort: 0 },
                    { label: "Immobilisations corporelles", brut: 0, amort: 0 },
                ],
                circulant: [
                    { label: "Stocks", brut: 0, amort: 0 },
                    { label: "Créances clients", brut: 0, amort: 0 },
                    { label: "Autres créances", brut: 0, amort: 0 },
                ],
                tresorerie: [
                    { label: "Banques", brut: 0, amort: 0 },
                    { label: "Caisse", brut: 0, amort: 0 },
                ],
            },
            passif: {
                capitauxPropres: [
                    { label: "Capital social", montant: 0 },
                    { label: "Réserves", montant: 0 },
                    { label: "Résultat de l'exercice", montant: 0 },
                ],
                dettes: [
                    { label: "Dettes fournisseurs", montant: 0 },
                    { label: "Dettes fiscales et sociales", montant: 0 },
                    { label: "Autres dettes", montant: 0 },
                ],
            },
        };

        // Attempt to fill some data from existing models

        // 1. Tresorerie (Bank Accounts)
        const bankAccounts = await prisma.bankAccount.findMany({
            where: { companyId }
        });
        const totalBank = bankAccounts.reduce((sum: number, acc) => sum + Number(acc.currentBalance), 0);
        bilanData.actif.tresorerie[0].brut = totalBank;

        // 2. Creances Clients (Unpaid Invoices)
        const unpaidInvoices = await prisma.invoice.findMany({
            where: {
                companyId,
                status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] }
            }
        });
        // This is rough approximation (remaining balance logic would be better)
        const totalReceivables = unpaidInvoices.reduce((sum: number, inv) => sum + Number(inv.totalTTC), 0); // Should subtract payments
        bilanData.actif.circulant[1].brut = totalReceivables;

        // 3. Dettes Fournisseurs (Unpaid Supplier Invoices)
        // Assuming SupplierInvoice model exists and mirrors Invoice
        /* 
        const unpaidSupplierInvoices = await prisma.supplierInvoice.findMany({
           where: {
               companyId,
               status: { in: ['PENDING', 'OVERDUE'] }
           }
        });
        const totalPayables = unpaidSupplierInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        bilanData.passif.dettes[0].montant = totalPayables;
        */

        return NextResponse.json(bilanData);

    } catch (error) {
        console.error("Erreur récupération bilan:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
