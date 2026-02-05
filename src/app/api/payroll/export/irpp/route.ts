import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");
        const periodParam = searchParams.get("period");

        if (!companyId || !periodParam) {
            return NextResponse.json({ error: "companyId et period requis" }, { status: 400 });
        }

        const runs = await prisma.payrollRun.findMany({
            where: { companyId }
        });

        const targetRun = runs.find(r =>
            new Date(r.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) === periodParam
        );

        if (!targetRun) {
            return NextResponse.json({ error: "Période non trouvée" }, { status: 404 });
        }

        const payslips = await prisma.payslip.findMany({
            where: {
                payrollRunId: targetRun.id
            },
            include: {
                employee: true
            }
        });

        // Headers: Matricule, Nom, Prénoms, Salaire Brut, CNSS Ouv., Base Imposable, IRPP Retenu, Net à Payer
        const csvRows = [];
        csvRows.push(['Matricule', 'Nom', 'Prénoms', 'Salaire Brut', 'CNSS Ouvrière', 'Base Imposable', 'IRPP', 'Net à Payer']);

        payslips.forEach(p => {
            const gross = Number(p.grossSalary);
            const cnss = Number(p.cnssEmployee);
            const taxable = gross - cnss; // Simplification

            csvRows.push([
                p.employee.id.substring(0, 8), // Matricule simulé
                p.employee.lastName,
                p.employee.firstName,
                gross.toFixed(0),
                cnss.toFixed(0),
                taxable.toFixed(0),
                Number(p.irRetained).toFixed(0),
                Number(p.netSalary).toFixed(0)
            ]);
        });

        // Totals
        const totalGross = payslips.reduce((sum, p) => sum + Number(p.grossSalary), 0);
        const totalIRPP = payslips.reduce((sum, p) => sum + Number(p.irRetained), 0);

        csvRows.push(['TOTAL', '', '', totalGross.toFixed(0), '', '', totalIRPP.toFixed(0), '']);

        const csvString = csvRows.map(row => row.join(';')).join('\n');

        return new NextResponse(csvString, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="irpp_${targetRun.id}.csv"`,
            }
        });

    } catch (error) {
        console.error("Erreur export IRPP:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
