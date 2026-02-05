import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");
        // const month = searchParams.get("month"); // Format "YYYY-MM" or similar

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        // Simplistic filter: Get all payslips linked to PayrollRuns of the company
        // Optionally filter by period if provided (e.g., matching periodStart)
        const whereClause: Prisma.PayslipWhereInput = {
            payrollRun: {
                companyId: companyId
            }
        };

        // If a specific period filter is needed, we would add it here.
        // For now, let's just return recent payslips.

        const payslips = await prisma.payslip.findMany({
            where: whereClause,
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        position: true,
                    }
                },
                payrollRun: {
                    select: {
                        periodStart: true,
                        status: true,
                        paymentDate: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform data for frontend
        const formattedPayslips = payslips.map(p => ({
            id: p.id,
            period: new Date(p.payrollRun.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
            employee: `${p.employee.firstName} ${p.employee.lastName}`,
            position: p.employee.position,
            baseSalary: Number(p.baseSalary),
            bonuses: Number(p.bonuses),
            deductions: Number(p.totalDeductions),
            netSalary: Number(p.netSalary),
            status: p.payrollRun.status === 'PAID' ? 'paid' : p.payrollRun.status === 'DRAFT' ? 'draft' : 'pending',
            paymentDate: p.payrollRun.paymentDate ? new Date(p.payrollRun.paymentDate).toLocaleDateString('fr-FR') : null,
        }));

        return NextResponse.json(formattedPayslips);

    } catch (error) {
        console.error("Erreur récupération bulletins:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
