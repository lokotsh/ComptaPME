import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");
        const periodParam = searchParams.get("period"); // "mois année" ex: "janvier 2026"

        if (!companyId || !periodParam) {
            return NextResponse.json({ error: "companyId et period requis" }, { status: 400 });
        }

        // Parse period string loosely or find run by matching formatted date
        // Ideally we would pass ID, but the frontend passes string.
        // Let's first try to find the run by ID if we change frontend, 
        // but for now let's find the run that matches the string or just match by year/month if passed.

        // Better approach: Find runs and match the formatted date in memory (less efficient but works for small scale)
        // OR: Require frontend to pass ID.
        // Let's assume the frontend passes the formatted string for now as implemented.

        // Workaround: We find all runs for company and filter in memory to find the one matching the string.
        const runs = await prisma.payrollRun.findMany({
            where: { companyId },

        });

        const targetRun = runs.find(r =>
            new Date(r.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) === periodParam
        );

        if (!targetRun) {
            return NextResponse.json({ error: "Période non trouvée" }, { status: 404 });
        }

        // Fetch payslips for this run
        const payslips = await prisma.payslip.findMany({
            where: {
                payrollRunId: targetRun.id
            },
            include: {
                employee: true
            }
        });

        // Generate CSV content
        // Headers: N° Affiliation, Nom, Prénoms, Sal. Brut, Cotis. Ouvrière, Cotis. Patronale, Totale
        const csvRows = [];
        csvRows.push(['N° Affiliation', 'Nom', 'Prénoms', 'Salaire Brut', 'Cotis. Ouvrière', 'Cotis. Patronale', 'Total Cotisations']);

        payslips.forEach(p => {
            csvRows.push([
                p.employee.cnssNumber || 'N/A',
                p.employee.lastName,
                p.employee.firstName,
                Number(p.grossSalary).toFixed(0),
                Number(p.cnssEmployee).toFixed(0),
                Number(p.cnssEmployer).toFixed(0),
                (Number(p.cnssEmployee) + Number(p.cnssEmployer)).toFixed(0)
            ]);
        });

        // Add footer total
        const totalGross = payslips.reduce((sum, p) => sum + Number(p.grossSalary), 0);
        const totalEmployee = payslips.reduce((sum, p) => sum + Number(p.cnssEmployee), 0);
        const totalEmployer = payslips.reduce((sum, p) => sum + Number(p.cnssEmployer), 0);

        csvRows.push(['TOTAL', '', '', totalGross.toFixed(0), totalEmployee.toFixed(0), totalEmployer.toFixed(0), (totalEmployee + totalEmployer).toFixed(0)]);

        // Format to CSV string
        const csvString = csvRows.map(row => row.join(';')).join('\n');

        return new NextResponse(csvString, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="cnss_${targetRun.id}.csv"`,
            }
        });

    } catch (error) {
        console.error("Erreur export CNSS:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
