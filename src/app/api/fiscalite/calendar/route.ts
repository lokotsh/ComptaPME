import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, addMonths } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json({ error: "companyId requis" }, { status: 400 });
        }

        const events = [];

        // 1. Fetch System Events (from TaxCalendar table if implemented, or dynamic generation)
        // Since we don't have a fully populated TaxCalendar table yet, we generate events based on rules.

        const now = new Date();
        const start = startOfMonth(now);
        const end = addMonths(endOfMonth(now), 2); // Look ahead 2 months

        // Rule A: TVA Declaration due 20th of each month
        // Iterate next 3 months
        for (let i = 0; i < 3; i++) {
            const dueDate = new Date(now.getFullYear(), now.getMonth() + i, 20);
            const periodDate = new Date(now.getFullYear(), now.getMonth() + i - 1, 1); // Previous month is the period

            // Check if declaration exists
            const declaration = await prisma.tvaDeclaration.findFirst({
                where: {
                    companyId,
                    periodStart: {
                        gte: startOfMonth(periodDate),
                        lte: endOfMonth(periodDate)
                    }
                }
            });

            // Calculate estimated amount if not done
            let amount = 0;
            if (declaration) {
                amount = Number(declaration.tvaDue);
            } else {
                // Estimate from invoices if possible (skipped for simplicity in this view)
            }

            events.push({
                id: `tva-${dueDate.toISOString()}`,
                date: dueDate,
                title: "Déclaration TVA",
                type: 'tva',
                amount: amount > 0 ? amount : undefined,
                status: declaration ? (declaration.status === 'PAID' ? 'paid' : 'pending') : 'pending' // Simplified status logic
            });
        }

        // Rule B: CNSS Declaration due 15th of each month
        for (let i = 0; i < 3; i++) {
            const dueDate = new Date(now.getFullYear(), now.getMonth() + i, 15);
            const periodDate = new Date(now.getFullYear(), now.getMonth() + i - 1, 1);

            const payrollRun = await prisma.payrollRun.findFirst({
                where: {
                    companyId,
                    periodStart: {
                        gte: startOfMonth(periodDate),
                        lte: endOfMonth(periodDate)
                    }
                }
            });

            let amount = 0;
            if (payrollRun) {
                amount = Number(payrollRun.totalCNSS);
            }

            events.push({
                id: `cnss-${dueDate.toISOString()}`,
                date: dueDate,
                title: "Déclaration CNSS",
                type: 'cnss',
                amount: amount > 0 ? amount : undefined,
                status: payrollRun ? 'pending' : 'pending' // Actual paid status checking would be better
            });
        }

        // Add any manual custom events from TaxCalendar table
        const customEvents = await prisma.taxCalendar.findMany({
            where: {
                companyId,
                dueDate: {
                    gte: start,
                    lte: end
                }
            }
        });

        customEvents.forEach(evt => {
            events.push({
                id: evt.id,
                date: evt.dueDate,
                title: evt.description,
                type: evt.taxType.toLowerCase(),
                amount: evt.amount ? Number(evt.amount) : undefined,
                status: evt.status.toLowerCase()
            });
        });

        // Sort by date
        events.sort((a, b) => a.date.getTime() - b.date.getTime());

        return NextResponse.json(events);

    } catch (error) {
        console.error("Erreur récupération calendrier fiscal:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) return NextResponse.json({ error: "companyId requis" }, { status: 400 });

        const newEvent = await prisma.taxCalendar.create({
            data: {
                companyId,
                taxType: body.type,
                description: body.title,
                dueDate: new Date(body.date),
                amount: body.amount ? Number(body.amount) : null,
                status: 'PENDING'
            }
        });

        return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {
        console.error("Erreur création événement fiscal:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
