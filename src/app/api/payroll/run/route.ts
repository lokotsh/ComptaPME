import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

// Type for employee from database query
interface EmployeeRecord {
    id: string;
    baseSalary: unknown; // Prisma Decimal, will be converted to number
    firstName: string;
    lastName: string;
    position: string | null;
    department: string | null;
}

const generatePayrollSchema = z.object({
    month: z.number().min(1).max(12),
    year: z.number().min(2020),
    paymentDate: z.string(),
    variables: z.array(z.object({
        employeeId: z.string(),
        bonuses: z.number().optional().default(0),
        deductions: z.number().optional().default(0),
    })).default([]),
});

// Mock IRPP Calculation (Benin simplified)
function calculateIRPP(taxableAmount: number): number {
    // Barème simplifié pour MVP
    if (taxableAmount <= 50000) return 0;

    let tax = 0;
    const amount = taxableAmount;

    // Tranche 1: 50,001 - 130,000 (10%)
    if (amount > 130000) {
        tax += (130000 - 50000) * 0.10;
    } else {
        return (amount - 50000) * 0.10;
    }

    // Tranche 2: 130,001 - 280,000 (15%)
    if (amount > 280000) {
        tax += (280000 - 130000) * 0.15;
    } else {
        return tax + (amount - 130000) * 0.15;
    }

    // Tranche 3: > 280,000 (20%)
    // Simplification grosse maille
    tax += (amount - 280000) * 0.20;

    return Math.floor(tax);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId"); // Or from body

        if (!companyId) {
            return NextResponse.json({ error: "companyId requis" }, { status: 400 });
        }

        const validation = generatePayrollSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { month, year, paymentDate, variables } = validation.data;

        // Définir la période
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0); // Dernier jour du mois

        // Vérifier existence
        const existingRun = await prisma.payrollRun.findFirst({
            where: {
                companyId,
                periodStart: periodStart,
            }
        });

        if (existingRun) {
            return NextResponse.json(
                { error: "Une paie existe déjà pour cette période" },
                { status: 409 }
            );
        }

        // Récupérer les employés actifs
        const employees = await prisma.employee.findMany({
            where: { companyId, isActive: true },
        });

        if (employees.length === 0) {
            return NextResponse.json(
                { error: "Aucun employé actif trouvé" },
                { status: 400 }
            );
        }

        // Calculs
        let totalGross = 0;
        let totalNet = 0;
        let totalCnssEmployee = 0;
        let totalCnssEmployer = 0;
        let totalIR = 0;

        const payslipsData = employees.map((emp: EmployeeRecord) => {
            const variable = variables.find(v => v.employeeId === emp.id);
            const bonuses = variable?.bonuses || 0;
            const otherDeductions = variable?.deductions || 0;

            const baseSalary = Number(emp.baseSalary);
            const grossSalary = baseSalary + bonuses;

            // CNSS Employé (3.6%)
            const cnssEmp = Math.ceil(grossSalary * 0.036);

            // IR (Simplifié - Base imposable = Brut - CNSS)
            const taxableBase = grossSalary - cnssEmp;
            const ir = calculateIRPP(taxableBase);

            // CNSS Employeur (15.4% - Allocation Familiale 9% + Accidents 1-4% + Retraite 6.4%...)
            // Simplification à 15% pour MVP
            const cnssEmplr = Math.ceil(grossSalary * 0.15);

            const totalDeductions = cnssEmp + ir + otherDeductions;
            const netSalary = grossSalary - totalDeductions;

            // Aggregation
            totalGross += grossSalary;
            totalNet += netSalary;
            totalCnssEmployee += cnssEmp;
            totalCnssEmployer += cnssEmplr;
            totalIR += ir;

            return {
                employeeId: emp.id,
                baseSalary,
                bonuses,
                overtime: 0,
                otherEarnings: 0,
                grossSalary,
                cnssEmployee: cnssEmp,
                irRetained: ir,
                otherDeductions,
                totalDeductions,
                cnssEmployer: cnssEmplr,
                otherEmployerCharges: 0,
                totalEmployerCharges: cnssEmplr,
                netSalary: netSalary > 0 ? netSalary : 0,
            };
        });

        // Récupérer un utilisateur par défaut pour createdBy (MVP Hack)
        const defaultUser = await prisma.user.findFirst({ where: { companyId } });
        if (!defaultUser) throw new Error("Aucun utilisateur trouvé pour cette entreprise");

        // Transaction DB
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const run = await tx.payrollRun.create({
                data: {
                    companyId,
                    createdById: defaultUser.id,
                    periodStart,
                    periodEnd,
                    paymentDate: new Date(paymentDate),
                    totalGross,
                    totalNetPay: totalNet,
                    totalEmployerCharges: totalCnssEmployer,
                    totalEmployeeDeductions: totalCnssEmployee + totalIR, // Just a sum for stats
                    totalCNSS: totalCnssEmployee + totalCnssEmployer,
                    totalIR: totalIR,
                    status: "DRAFT",
                    payslips: {
                        create: payslipsData
                    }
                },
                include: {
                    payslips: true
                }
            });
            return run;
        });

        // Audit Log
        await logAudit({
            action: 'CREATE',
            entityType: 'PAYROLL_RUN',
            entityId: result.id,
            details: {
                period: `${month}/${year}`,
                totalNet: result.totalNetPay,
                employeeCount: employees.length
            }
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error("Erreur génération paie:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
