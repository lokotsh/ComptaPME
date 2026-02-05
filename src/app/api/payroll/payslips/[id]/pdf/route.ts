import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Type for jsPDF with autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json({ error: "companyId requis" }, { status: 400 });
        }

        const payslip = await prisma.payslip.findUnique({
            where: { id: params.id },
            include: {
                employee: true,
                payrollRun: {
                    include: {
                        company: true
                    }
                }
            }
        });

        if (!payslip) {
            return NextResponse.json({ error: "Bulletin non trouvé" }, { status: 404 });
        }

        // Authorization check
        if (payslip.payrollRun.companyId !== companyId) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        // Generate PDF
        const doc = new jsPDF();
        const company = payslip.payrollRun.company;
        const employee = payslip.employee;
        const pageWidth = doc.internal.pageSize.width;

        // Header - Company Info
        doc.setFontSize(14);
        doc.text(company.name, 20, 20);
        doc.setFontSize(10);
        doc.text(company.address || "", 20, 26);
        doc.text(`Tél: ${company.phone || "-"}`, 20, 31);

        // Header - Payslip Title & Period
        const period = new Date(payslip.payrollRun.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        doc.setFontSize(16);
        doc.text(`BULLETIN DE PAIE`, pageWidth / 2, 20, { align: "center" });
        doc.setFontSize(12);
        doc.text(`Période: ${period}`, pageWidth / 2, 28, { align: "center" });

        // Employee Info Box
        doc.setDrawColor(200);
        doc.rect(120, 35, 70, 35);
        doc.setFontSize(10);
        doc.text(`Matricule: ${employee.cnssNumber || employee.id.substring(0, 8)}`, 125, 42);
        doc.text(`Nom: ${employee.lastName}`, 125, 48);
        doc.text(`Prénom: ${employee.firstName}`, 125, 54);
        doc.text(`Poste: ${employee.position || "-"}`, 125, 60);
        doc.text(`Département: ${employee.department || "-"}`, 125, 66);

        // Body - Salary Details
        const startY = 80;

        autoTable(doc, {
            startY: startY,
            head: [['Désignation', 'Base', 'Taux', 'Montant (Gain)', 'Montant (Retenue)']],
            body: [
                ['Salaire de base', Number(payslip.baseSalary).toLocaleString(), '-', Number(payslip.baseSalary).toLocaleString(), '-'],
                ['Primes et Indemnités', Number(payslip.bonuses).toLocaleString(), '-', Number(payslip.bonuses).toLocaleString(), '-'],
                ['Heures supplémentaires', Number(payslip.overtime).toLocaleString(), '-', Number(payslip.overtime).toLocaleString(), '-'],
                ['Salaire Brut', '', '', Number(payslip.grossSalary).toLocaleString(), '-'],
                ['CNSS (Part Salariale)', Number(payslip.grossSalary).toLocaleString(), '3.6%', '-', Number(payslip.cnssEmployee).toLocaleString()],
                ['Impôt sur le Revenu (IRPP)', '-', '-', '-', Number(payslip.irRetained).toLocaleString()],
                ['Autres retenues', '-', '-', '-', Number(payslip.otherDeductions).toLocaleString()],
            ],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 10 },
            columnStyles: {
                0: { cellWidth: 70 },
                3: { halign: 'right' },
                4: { halign: 'right' }
            }
        });

        const finalY = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

        // Footer - Totals
        autoTable(doc, {
            startY: finalY,
            body: [
                ['Total Brut', Number(payslip.grossSalary).toLocaleString()],
                ['Total Cotisations', Number(payslip.totalDeductions).toLocaleString()],
                ['Net à Payer', Number(payslip.netSalary).toLocaleString() + ' XOF']
            ],
            theme: 'plain',
            styles: { fontSize: 12, fontStyle: 'bold', halign: 'right' },
            columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 50 } }
        });

        // Signatures
        doc.text("Signature Employé", 40, finalY + 40);
        doc.text("Signature Employeur", 140, finalY + 40);

        // Output as Buffer
        const pdfOutput = doc.output('arraybuffer');
        const buffer = Buffer.from(pdfOutput);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="bulletin-${payslip.id}.pdf"`,
            },
        });

    } catch (error) {
        console.error("Erreur génération PDF paie:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
