import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Générer le HTML de la facture (pour PDF côté client)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        company: {
          include: {
            settings: true,
          },
        },
        lines: {
          orderBy: { position: "asc" },
        },
        createdBy: {
          select: { name: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    // Générer le QR Code si les données MECeF sont présentes
    let qrCodeDataUrl = null;
    if (invoice.mecefQrCode) {
      try {
        qrCodeDataUrl = await QRCode.toDataURL(invoice.mecefQrCode);
      } catch (err) {
        console.error("Erreur génération QR Code:", err);
      }
    }

    // Générer le HTML de la facture
    const html = generateInvoiceHTML(invoice, qrCodeDataUrl);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}

function generateInvoiceHTML(invoice: {
  number: string;
  type: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  mecefNim: string | null;
  mecefCounters: string | null;
  mecefDtc: string | null;
  mecefQrCode: string | null;
  mecefSignature: string | null;
  mecefType: string | null;
  totalHT: { toNumber: () => number } | number;
  totalTVA: { toNumber: () => number } | number;
  totalTTC: { toNumber: () => number } | number;
  notes: string | null;
  legalMentions: string | null;
  client: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    ifu: string | null;
  };
  company: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    ifu: string | null;
    rccm: string | null;
    logo: string | null;
    settings: {
      invoiceFooter: string | null;
      legalMentions: string | null;
    } | null;
  };
  lines: Array<{
    description: string;
    quantity: { toNumber: () => number } | number;
    unitPriceHT: { toNumber: () => number } | number;
    tvaRate: { toNumber: () => number } | number;
    totalHT: { toNumber: () => number } | number;
    totalTTC: { toNumber: () => number } | number;
  }>;
}, qrCodeUrl: string | null) {
  const formatNumber = (val: { toNumber: () => number } | number) => {
    const num = typeof val === 'number' ? val : val.toNumber();
    return num.toLocaleString("fr-FR");
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const typeLabels: Record<string, string> = {
    QUOTE: "DEVIS",
    ORDER: "BON DE COMMANDE",
    INVOICE: "FACTURE",
    CREDIT_NOTE: "AVOIR",
  };

  const statusLabels: Record<string, string> = {
    DRAFT: "Brouillon",
    SENT: "Émise",
    PARTIALLY_PAID: "Partiellement payée",
    PAID: "Payée",
    OVERDUE: "En retard",
    CANCELLED: "Annulée",
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${typeLabels[invoice.type]} ${invoice.number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #1a1a1a;
      background: #fff;
      padding: 40px;
    }
    
    .invoice {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .company-info h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 8px;
    }
    
    .company-info p {
      color: #6b7280;
      line-height: 1.5;
    }
    
    .invoice-type {
      text-align: right;
    }
    
    .invoice-type h2 {
      font-size: 28px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 8px;
    }
    
    .invoice-type .number {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    
    .invoice-type .status {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      background: #dbeafe;
      color: #1e40af;
    }
    
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    
    .party {
      width: 45%;
    }
    
    .party h3 {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .party-box {
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .party-box .name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .party-box p {
      color: #6b7280;
      line-height: 1.6;
    }
    
    .dates {
      display: flex;
      gap: 40px;
      margin-bottom: 30px;
    }
    
    .date-item {
      display: flex;
      gap: 8px;
    }
    
    .date-item .label {
      color: #6b7280;
    }
    
    .date-item .value {
      font-weight: 600;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    thead {
      background: #1e40af;
      color: white;
    }
    
    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
    }
    
    th:last-child, td:last-child {
      text-align: right;
    }
    
    tbody tr {
      border-bottom: 1px solid #e5e7eb;
    }
    
    td {
      padding: 16px;
    }
    
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    
    .totals-box {
      width: 300px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .total-row.final {
      border: none;
      padding-top: 12px;
      font-size: 16px;
      font-weight: 700;
      color: #1e40af;
    }
    
    .notes {
      margin-bottom: 30px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .notes h4 {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 10px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .invoice {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="company-info">
        <h1>${invoice.company.name}</h1>
        <p>
          ${invoice.company.address || ""}<br>
          ${invoice.company.phone ? `Tél: ${invoice.company.phone}` : ""}<br>
          ${invoice.company.email || ""}<br>
          ${invoice.company.ifu ? `IFU: ${invoice.company.ifu}` : ""}
          ${invoice.company.rccm ? ` | RCCM: ${invoice.company.rccm}` : ""}
        </p>
      </div>
      <div class="invoice-type">
        <h2>${typeLabels[invoice.type]}</h2>
        <div class="number">${invoice.number}</div>
        <div class="status">${statusLabels[invoice.status]}</div>
      </div>
    </div>
    
    <div class="parties">
      <div class="party">
        <h3>Émetteur</h3>
        <div class="party-box">
          <div class="name">${invoice.company.name}</div>
          <p>
            ${invoice.company.address || ""}<br>
            ${invoice.company.ifu ? `IFU: ${invoice.company.ifu}` : ""}
          </p>
        </div>
      </div>
      <div class="party">
        <h3>Destinataire</h3>
        <div class="party-box">
          <div class="name">${invoice.client.name}</div>
          <p>
            ${invoice.client.address || ""}<br>
            ${invoice.client.phone ? `Tél: ${invoice.client.phone}` : ""}<br>
            ${invoice.client.ifu ? `IFU: ${invoice.client.ifu}` : ""}
          </p>
        </div>
      </div>
    </div>
    
    <div class="dates">
      <div class="date-item">
        <span class="label">Date d'émission:</span>
        <span class="value">${formatDate(invoice.issueDate)}</span>
      </div>
      <div class="date-item">
        <span class="label">Date d'échéance:</span>
        <span class="value">${formatDate(invoice.dueDate)}</span>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 40%">Description</th>
          <th>Qté</th>
          <th>P.U. HT</th>
          <th>TVA</th>
          <th>Total TTC</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lines
      .map(
        (line) => `
          <tr>
            <td>${line.description}</td>
            <td>${formatNumber(line.quantity)}</td>
            <td>${formatNumber(line.unitPriceHT)} XOF</td>
            <td>${formatNumber(line.tvaRate)}%</td>
            <td>${formatNumber(line.totalTTC)} XOF</td>
          </tr>
        `
      )
      .join("")}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="totals-box">
        <div class="total-row">
          <span>Sous-total HT</span>
          <span>${formatNumber(invoice.totalHT)} XOF</span>
        </div>
        <div class="total-row">
          <span>TVA</span>
          <span>${formatNumber(invoice.totalTVA)} XOF</span>
        </div>
        <div class="total-row final">
          <span>TOTAL TTC</span>
          <span>${formatNumber(invoice.totalTTC)} XOF</span>
        </div>
      </div>
    </div>
    
    ${invoice.notes
      ? `
    <div class="notes">
      <h4>Notes</h4>
      <p>${invoice.notes}</p>
    </div>
    `
      : ""
    }

    ${invoice.mecefNim
      ? `
    <div style="margin-top: 30px; border: 2px solid #1e40af; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: start;">
        <div style="flex: 1;">
            <h4 style="color: #1e40af; margin-bottom: 10px; font-size: 14px; text-transform: uppercase;">Facture Normalisée (MECeF)</h4>
            <p style="margin-bottom: 4px;"><strong>NIM:</strong> ${invoice.mecefNim}</p>
            <p style="margin-bottom: 4px;"><strong>Compteurs:</strong> ${invoice.mecefCounters}</p>
            <p style="margin-bottom: 4px;"><strong>Signature:</strong> ${invoice.mecefSignature}</p>
            <p style="margin-bottom: 4px;"><strong>Date:</strong> ${invoice.mecefDtc}</p>
        </div>
        ${qrCodeUrl
        ? `<div style="margin-left: 20px;"><img src="${qrCodeUrl}" width="100" height="100" alt="QR Code MECeF" /></div>`
        : '<div style="margin-left: 20px; border: 1px dashed #ccc; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;">No QR</div>'
      }
    </div>
    `
      : ""
    }
    
    <div class="footer">
      <p>${invoice.company.settings?.invoiceFooter || invoice.legalMentions || "Merci pour votre confiance."}</p>
      <p style="margin-top: 8px;">${invoice.company.name} - ${invoice.company.ifu ? `IFU: ${invoice.company.ifu}` : ""}</p>
    </div>
  </div>
  
  <script>
    // Auto-print when opened
    // window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;
}
