import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Copie de generateInvoiceNumber (ou import si partagé)
async function generateInvoiceNumber(companyId: string, type: string): Promise<string> {
    const settings = await prisma.companySettings.findUnique({
        where: { companyId },
    });

    const prefix = type === "QUOTE" ? (settings?.quotePrefix || "DEV") : (settings?.invoicePrefix || "FAC");
    const year = new Date().getFullYear();

    // Trouver la dernière facture de ce type pour cette année
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

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        // 1. Récupérer le devis
        const quote = await prisma.invoice.findUnique({
            where: { id },
            include: { lines: true },
        });

        if (!quote) {
            return NextResponse.json(
                { error: "Devis introuvable" },
                { status: 404 }
            );
        }

        if (quote.type !== "QUOTE") {
            return NextResponse.json(
                { error: "Ce document n'est pas un devis" },
                { status: 400 }
            );
        }

        // 2. Générer un numéro de facture
        const newNumber = await generateInvoiceNumber(quote.companyId, "INVOICE");

        // 3. Créer la facture à partir du devis
        const newInvoice = await prisma.invoice.create({
            data: {
                companyId: quote.companyId,
                clientId: quote.clientId,
                createdById: quote.createdById, // On garde l'auteur original ou on prend celui de la session si dispo (ici simplifié)
                number: newNumber,
                series: "FAC",
                type: "INVOICE",
                status: "DRAFT", // Une facture issue d'un devis commence souvent en brouillon pour vérification
                issueDate: new Date(), // Date du jour
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours par défaut
                totalHT: quote.totalHT,
                totalTVA: quote.totalTVA,
                totalTTC: quote.totalTTC,
                notes: `Facture générée à partir du devis ${quote.number}`,
                lines: {
                    create: quote.lines.map(line => ({
                        description: line.description,
                        quantity: line.quantity,
                        unitPriceHT: line.unitPriceHT,
                        tvaRate: line.tvaRate,
                        discountPercent: line.discountPercent,
                        totalHT: line.totalHT,
                        totalTVA: line.totalTVA,
                        totalTTC: line.totalTTC,
                        position: line.position,
                        accountId: line.accountId
                    }))
                }
            }
        });

        // 4. (Optionnel) Marquer le devis comme "Transformé" ?
        // Le schéma actuel ne permet pas de statut custom hors enum, donc on laisse en SENT ou on passe en PAID si on considère que c'est "fini".
        // Pour l'instant on ne fait rien sur le devis.

        return NextResponse.json(newInvoice, { status: 201 });

    } catch (error) {
        console.error("Erreur lors de la conversion du devis:", error);
        return NextResponse.json(
            { error: "Erreur lors de la conversion" },
            { status: 500 }
        );
    }
}
