import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config"; // Assurez-vous que le chemin est correct

export async function GET(request: NextRequest) {
    try {
        // Authentification réelle
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.companyId) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const companyId = session.user.companyId;

        // 1. Calcul du Chiffre d'Affaires (Somme des factures valides)
        // On peut décider de ne compter que les factures 'PAID' ou toutes les factures émises 'SENT', 'PAID', 'PARTIALLY_PAID'.
        // Ici, prenons toutes les factures validées (statut != DRAFT et != CANCELLED)
        const invoicesAgg = await prisma.invoice.aggregate({
            where: {
                companyId: companyId, // Décommentez quand l'auth est active
                status: {
                    in: ["SENT", "PAID", "PARTIALLY_PAID", "OVERDUE"]
                }
            },
            _sum: {
                totalTTC: true
            }
        });
        const revenue = Number(invoicesAgg._sum.totalTTC || 0);

        // 2. Calcul des Dépenses (Somme des transactions bancaires sortantes ou factures fournisseurs)
        // Si vous avez un modèle 'Expense' ou 'Purchase', utilisez-le. 
        // Sinon, basons-nous sur les sorties de caisse/banque si disponibles, ou 0 pour l'instant.
        // Simulons avec 0 si pas de modèle Dépenses clair, ou cherchons une table SupplierInvoice.
        // Supposons qu'on n'a pas encore de module complet de dépenses, on met 0 ou une valeur fictive calculée.
        const expenses = 0;

        // 3. Solde Bancaire
        // Solde = Paiements reçus - Dépenses estimées
        const paymentsAgg = await prisma.payment.aggregate({
            where: {
                invoice: { companyId: companyId }
            },
            _sum: {
                amount: true
            }
        });
        const bankBalance = Number(paymentsAgg._sum.amount || 0) - expenses;

        // 4. Clients Actifs
        const activeClients = await prisma.client.count({
            where: {
                companyId: companyId
            }
        });

        // 5. Factures Récentes
        const recentInvoicesRaw = await prisma.invoice.findMany({
            where: {
                companyId: companyId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5,
            include: {
                client: true
            }
        });

        const recentInvoices = recentInvoicesRaw.map((inv: any) => ({
            id: inv.id,
            number: inv.number,
            client: inv.client.name,
            amount: Number(inv.totalTTC),
            status: inv.status,
            date: inv.issueDate.toISOString().split('T')[0] // Format YYYY-MM-DD
        }));

        // 6. Alertes (logique simple)
        const alerts = [];
        const overdueCount = await prisma.invoice.count({
            where: {
                companyId: companyId,
                status: "OVERDUE"
            }
        });
        if (overdueCount > 0) {
            alerts.push({ type: "error", message: `${overdueCount} factures en retard de paiement`, count: overdueCount });
        }

        const draftCount = await prisma.invoice.count({
            where: {
                companyId: companyId,
                status: "DRAFT"
            }
        });
        if (draftCount > 0) {
            alerts.push({ type: "info", message: `${draftCount} factures en brouillon à valider`, count: draftCount });
        }

        // Retour des données
        return NextResponse.json({
            stats: {
                revenue,
                expenses,
                bankBalance,
                activeClients
            },
            recentInvoices,
            alerts
        });

    } catch (error) {
        console.error("Erreur Dashboard Stats:", error);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
