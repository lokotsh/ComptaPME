import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        const invoice = await prisma.supplierInvoice.findUnique({
            where: {
                id: params.id,
                companyId, // Sécurité multi-tenant
            },
            include: {
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        address: true,
                    },
                },
                lines: true,
                payments: {
                    orderBy: { paymentDate: "desc" },
                },
                documents: true,
            },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "Facture introuvable" },
                { status: 404 }
            );
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("Erreur récupération facture:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        // Vérifier si la facture existe et appartient à l'entreprise
        const invoice = await prisma.supplierInvoice.findUnique({
            where: { id: params.id, companyId },
            include: { payments: true },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "Facture introuvable" },
                { status: 404 }
            );
        }

        // Empêcher la suppression si des paiements existent
        if (invoice.payments.length > 0) {
            return NextResponse.json(
                { error: "Impossible de supprimer une facture ayant des paiements enregistrés" },
                { status: 400 }
            );
        }

        // TODO: Supprimer les documents liés sur le disque/storage
        // Pour l'instant on supprime juste l'entrée DB (cascade supprimera les liens)

        await prisma.supplierInvoice.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erreur suppression facture:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
