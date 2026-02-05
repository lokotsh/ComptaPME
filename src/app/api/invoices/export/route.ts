import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Exporter les factures en CSV
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        // Récupérer toutes les factures de l'entreprise
        const invoices = await prisma.invoice.findMany({
            where: {
                companyId,
                status: {
                    not: "CANCELLED" // On peut inclure ou exclure les annulées selon le besoin
                }
            },
            include: {
                client: {
                    select: { name: true }
                }
            },
            orderBy: { issueDate: "desc" }
        });

        // Générer le contenu CSV
        const header = [
            "Numéro",
            "Date émission",
            "Date échéance",
            "Client",
            "Total HT",
            "Total TVA",
            "Total TTC",
            "Montant Payé",
            "Statut"
        ].join(";"); // Utilisation du point-virgule pour Excel francophone

        const rows = invoices.map(inv => {
            const statusMap: Record<string, string> = {
                DRAFT: "Brouillon",
                SENT: "Envoyée",
                PARTIALLY_PAID: "Partiellement payée",
                PAID: "Payée",
                OVERDUE: "En retard",
                CANCELLED: "Annulée"
            };

            return [
                inv.number,
                new Date(inv.issueDate).toLocaleDateString("fr-FR"),
                new Date(inv.dueDate).toLocaleDateString("fr-FR"),
                `"${inv.client.name.replace(/"/g, '""')}"`, // Échappement des guillemets
                inv.totalHT.toString().replace(".", ","),
                inv.totalTVA.toString().replace(".", ","),
                inv.totalTTC.toString().replace(".", ","),
                inv.amountPaid.toString().replace(".", ","),
                statusMap[inv.status] || inv.status
            ].join(";");
        });

        const csvContent = "\uFEFF" + [header, ...rows].join("\n"); // BOM pour Excel

        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `factures_export_${dateStr}.csv`;

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });

    } catch (error) {
        console.error("Erreur lors de l'export des factures:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'export des factures" },
            { status: 500 }
        );
    }
}
