import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const employeeSchema = z.object({
    firstName: z.string().min(1, "Prénom requis"),
    lastName: z.string().min(1, "Nom requis"),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),

    // Administratif
    cnssNumber: z.string().optional().nullable(),
    ifu: z.string().optional().nullable(),

    // Contrat
    hireDate: z.string(), // ISO Date
    contractType: z.enum(["CDI", "CDD", "STAGE", "INTERIM", "CONSULTANT"]),
    position: z.string().min(1, "Poste requis"),
    department: z.string().optional().nullable(),

    // Salaire
    baseSalary: z.number().min(0),
    paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "CHECK", "MOBILE_MONEY"]).default("BANK_TRANSFER"),
    bankName: z.string().optional().nullable(),
    bankAccountNumber: z.string().optional().nullable(),
});

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

        const employees = await prisma.employee.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(employees);
    } catch (error) {
        console.error("Erreur récupération employés:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { companyId, ...data } = body;

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId est requis" },
                { status: 400 }
            );
        }

        const validation = employeeSchema.safeParse(data);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const employee = await prisma.employee.create({
            data: {
                companyId,
                ...validation.data,
                hireDate: new Date(validation.data.hireDate),
                // Fix optional empty strings to null for better DB handling if needed
                email: validation.data.email || null,
            },
        });

        return NextResponse.json(employee, { status: 201 });
    } catch (error) {
        console.error("Erreur création employé:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
