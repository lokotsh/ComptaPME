import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Générer l'export FEC (Fichier des Écritures Comptables)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fiscalYearId = searchParams.get("fiscalYearId");
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        // Récupérer l'exercice fiscal
        let fiscalYear;
        if (fiscalYearId) {
            fiscalYear = await prisma.fiscalYear.findUnique({
                where: { id: fiscalYearId },
            });
        } else {
            fiscalYear = await prisma.fiscalYear.findFirst({
                where: { companyId, isClosed: false },
                orderBy: { startDate: "desc" },
            });
        }

        if (!fiscalYear) {
            return NextResponse.json(
                { error: "Exercice fiscal introuvable" },
                { status: 404 }
            );
        }

        // Récupérer les écritures validées
        const entries = await prisma.journalEntry.findMany({
            where: {
                fiscalYearId: fiscalYear.id,
                isValidated: true,
            },
            include: {
                lines: {
                    include: {
                        account: true,
                    },
                },
            },
            orderBy: [{ entryDate: "asc" }, { reference: "asc" }],
        });

        // Récupérer les infos de la société
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            return NextResponse.json(
                { error: "Société introuvable" },
                { status: 404 }
            );
        }

        // Générer le contenu FEC au format réglementaire
        const fecLines: string[] = [];

        // En-tête FEC
        const header = [
            "JournalCode",
            "JournalLib",
            "EcritureNum",
            "EcritureDate",
            "CompteNum",
            "CompteLib",
            "CompAuxNum",
            "CompAuxLib",
            "PieceRef",
            "PieceDate",
            "EcritureLib",
            "Debit",
            "Credit",
            "EcrtureLet",
            "DateLet",
            "ValidDate",
            "Montantdevise",
            "Idevise",
        ].join("\t");

        fecLines.push(header);

        // Mapper les types de journal
        const journalCodeMap: Record<string, string> = {
            SALES: "VE",
            PURCHASES: "AC",
            BANK: "BQ",
            CASH: "CA",
            GENERAL: "OD",
        };

        const journalLibMap: Record<string, string> = {
            SALES: "Ventes",
            PURCHASES: "Achats",
            BANK: "Banque",
            CASH: "Caisse",
            GENERAL: "Opérations Diverses",
        };

        // Types for journal entries
        type JournalLine = { account: { code: string; label: string }; label: string | null; debit: unknown; credit: unknown };
        type JournalEntry = { journalType: string; reference: string | null; entryDate: Date; description: string; isValidated: boolean; updatedAt: Date; lines: JournalLine[] };

        // Générer les lignes FEC
        entries.forEach((entry: JournalEntry) => {
            entry.lines.forEach((line: JournalLine) => {
                const fecLine = [
                    journalCodeMap[entry.journalType] || "OD", // JournalCode
                    journalLibMap[entry.journalType] || "Opérations Diverses", // JournalLib
                    entry.reference, // EcritureNum
                    formatDateFEC(entry.entryDate), // EcritureDate
                    line.account.code, // CompteNum
                    line.account.label, // CompteLib
                    "", // CompAuxNum (compte auxiliaire)
                    "", // CompAuxLib
                    entry.reference, // PieceRef
                    formatDateFEC(entry.entryDate), // PieceDate
                    line.label || entry.description, // EcritureLib
                    formatAmountFEC(Number(line.debit)), // Debit
                    formatAmountFEC(Number(line.credit)), // Credit
                    "", // EcrtureLet (lettrage)
                    "", // DateLet
                    entry.isValidated ? formatDateFEC(entry.updatedAt) : "", // ValidDate
                    "", // Montantdevise
                    "", // Idevise
                ].join("\t");

                fecLines.push(fecLine);
            });
        });

        const fecContent = fecLines.join("\n");

        // Générer le nom du fichier
        const startYear = new Date(fiscalYear.startDate).getFullYear();
        const siren = company.ifu?.replace(/^320/, "") || "000000000";
        const fileName = `${siren}FEC${startYear}1231.txt`;

        // Retourner le fichier
        return new NextResponse(fecContent, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error("Erreur lors de la génération du FEC:", error);
        return NextResponse.json(
            { error: "Erreur lors de la génération du FEC" },
            { status: 500 }
        );
    }
}

// Formater une date au format FEC (YYYYMMDD)
function formatDateFEC(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
}

// Formater un montant au format FEC (virgule décimale, 2 décimales)
function formatAmountFEC(amount: number): string {
    return amount.toFixed(2).replace(".", ",");
}
