import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logAudit } from "@/lib/audit";

const Decimal = Prisma.Decimal;

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Récupérer une facture par ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                client: true,
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
                lines: {
                    orderBy: { position: "asc" },
                    include: {
                        account: {
                            select: { id: true, code: true, label: true },
                        },
                    },
                },
                payments: {
                    orderBy: { paymentDate: "desc" },
                },
                company: {
                    select: {
                        name: true,
                        address: true,
                        phone: true,
                        email: true,
                        ifu: true,
                        rccm: true,
                        logo: true,
                    },
                },
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
        console.error("Erreur lors de la récupération de la facture:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération de la facture" },
            { status: 500 }
        );
    }
}

// PUT - Mettre à jour une facture
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const invoice = await prisma.invoice.findUnique({
            where: { id },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "Facture introuvable" },
                { status: 404 }
            );
        }

        // On ne peut modifier que les factures en brouillon
        if (invoice.status !== "DRAFT") {
            return NextResponse.json(
                { error: "Seules les factures en brouillon peuvent être modifiées" },
                { status: 400 }
            );
        }

        const { lines, ...updateData } = body;

        // Si les lignes sont fournies, recalculer les totaux
        if (lines && Array.isArray(lines)) {
            let totalHT = 0;
            let totalTVA = 0;
            let totalTTC = 0;

            const linesWithAmounts = lines.map((line: {
                description: string;
                quantity: number;
                unitPriceHT: number;
                tvaRate: number;
                discountPercent?: number;
                accountId?: string;
            }, index: number) => {
                const baseHT = line.quantity * line.unitPriceHT;
                const discount = baseHT * ((line.discountPercent || 0) / 100);
                const lineHT = baseHT - discount;
                const lineTVA = lineHT * (line.tvaRate / 100);
                const lineTTC = lineHT + lineTVA;

                totalHT += lineHT;
                totalTVA += lineTVA;
                totalTTC += lineTTC;

                return {
                    description: line.description,
                    quantity: new Decimal(line.quantity),
                    unitPriceHT: new Decimal(line.unitPriceHT),
                    tvaRate: new Decimal(line.tvaRate),
                    discountPercent: new Decimal(line.discountPercent || 0),
                    totalHT: new Decimal(lineHT),
                    totalTVA: new Decimal(lineTVA),
                    totalTTC: new Decimal(lineTTC),
                    position: index,
                    accountId: line.accountId || null,
                };
            });

            // Supprimer les anciennes lignes et créer les nouvelles
            await prisma.invoiceLine.deleteMany({ where: { invoiceId: id } });

            const updatedInvoice = await prisma.invoice.update({
                where: { id },
                data: {
                    ...updateData,
                    totalHT: new Decimal(totalHT),
                    totalTVA: new Decimal(totalTVA),
                    totalTTC: new Decimal(totalTTC),
                    lines: {
                        create: linesWithAmounts,
                    },
                },
                include: {
                    client: true,
                    lines: true,
                },
            });

            return NextResponse.json(updatedInvoice);
        }

        // Mise à jour simple sans lignes
        const updatedInvoice = await prisma.invoice.update({
            where: { id },
            data: updateData,
        });

        // Audit Log
        const oldDetails = {
            status: invoice.status,
            dueDate: invoice.dueDate,
            total: invoice.totalTTC,
            client: invoice.clientId,
            // ... autres champs pertinents
        };

        await logAudit({
            action: 'UPDATE',
            entityType: 'INVOICE',
            entityId: id,
            oldDetails: oldDetails,
            details: updateData
        });

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la facture:", error);
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour de la facture" },
            { status: 500 }
        );
    }
}

// DELETE - Supprimer une facture
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { payments: true },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "Facture introuvable" },
                { status: 404 }
            );
        }

        // On ne peut supprimer que les brouillons sans paiements
        if (invoice.status !== "DRAFT") {
            return NextResponse.json(
                { error: "Seules les factures en brouillon peuvent être supprimées" },
                { status: 400 }
            );
        }

        if (invoice.payments.length > 0) {
            return NextResponse.json(
                { error: "Impossible de supprimer une facture avec des paiements" },
                { status: 400 }
            );
        }

        // Audit Log
        await logAudit({
            action: 'DELETE',
            entityType: 'INVOICE',
            entityId: id,
            oldDetails: { number: invoice.number, total: invoice.totalTTC, client: invoice.clientId }
        });

        await prisma.invoice.delete({ where: { id } });

        return NextResponse.json({ message: "Facture supprimée" });
    } catch (error) {
        console.error("Erreur lors de la suppression de la facture:", error);
        return NextResponse.json(
            { error: "Erreur lors de la suppression de la facture" },
            { status: 500 }
        );
    }
}
