"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    ArrowLeft,
    Download,
    Mail,
    Printer,
    Edit,
    Trash2,
    Calendar as CalendarIcon,
    Building2,
    Phone,
    MapPin,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Ban,
    Send,
    FileText,
    Check,
    FileInput
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InvoiceLine {
    id: string;
    description: string;
    quantity: number;
    unitPriceHT: number;
    totalHT: number;
    tvaRate: number;
}

interface Quote {
    id: string;
    number: string;
    issueDate: string;
    dueDate: string;
    status: string;
    notes?: string;
    client: {
        name: string;
        email?: string;
        address?: string;
        phone?: string;
        ifu?: string;
    };
    company: {
        name: string;
        email?: string;
        address?: string;
        phone?: string;
        ifu?: string;
        logoUrl?: string;
    };
    lines: InvoiceLine[];
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    DRAFT: { label: "Brouillon", color: "bg-slate-100 text-slate-700", icon: Edit },
    SENT: { label: "Envoyé", color: "bg-blue-100 text-blue-700", icon: Send },
    ACCEPTED: { label: "Accepté", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    REJECTED: { label: "Refusé", color: "bg-red-100 text-red-700", icon: Ban },
    EXPIRED: { label: "Expiré", color: "bg-orange-100 text-orange-700", icon: Clock },
};

export default function QuoteDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [quote, setQuote] = React.useState<Quote | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isConverting, setIsConverting] = React.useState(false);

    const fetchQuote = React.useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/invoices/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setQuote(data);
            } else {
                console.error("Devis introuvable");
            }
        } catch (error) {
            console.error("Erreur chargement devis", error);
        } finally {
            setIsLoading(false);
        }
    }, [params.id]);

    React.useEffect(() => {
        if (session) {
            fetchQuote();
        }
    }, [session, fetchQuote]);

    const generateDoc = () => {
        if (!quote) return null;
        const doc = new jsPDF();

        const formatAmount = (amount: number | string) => {
            const num = Number(amount);
            if (isNaN(num)) return "0";
            return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        };

        // --- EN-TÊTE ---
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(quote.company?.name || "Ma Société", 20, 25);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        let yPos = 32;
        if (quote.company?.address) { doc.text(quote.company.address, 20, yPos); yPos += 5; }
        if (quote.company?.phone) { doc.text(`Tél: ${quote.company.phone}`, 20, yPos); yPos += 5; }
        if (quote.company?.email) { doc.text(quote.company.email, 20, yPos); yPos += 5; }

        doc.setFontSize(30);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(200, 200, 200);
        doc.text("DEVIS", 190, 30, { align: "right" });

        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        doc.text(`N° ${quote.number}`, 190, 40, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Date : ${format(new Date(quote.issueDate), "dd/MM/yyyy")}`, 190, 46, { align: "right" });
        doc.text(`Validité : ${format(new Date(quote.dueDate), "dd/MM/yyyy")}`, 190, 52, { align: "right" });

        // --- INFO CLIENT ---
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(20, 65, 80, 35, 2, 2, "F");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Client :", 25, 72);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(quote.client.name, 25, 78);

        // --- TABLEAU ---
        const tableColumn = ["Description", "Qté", "Prix U. HT", "Total HT"];
        const tableRows = quote.lines.map(line => [
            line.description,
            line.quantity.toString(),
            formatAmount(line.unitPriceHT),
            formatAmount(line.totalHT)
        ]);

        autoTable(doc, {
            startY: 110,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
        });

        // --- TOTAUX ---
        // @ts-ignore
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text(`Total HT : ${formatAmount(quote.totalHT)} XOF`, 190, finalY + 8, { align: "right" });
        doc.text(`TVA : ${formatAmount(quote.totalTVA)} XOF`, 190, finalY + 14, { align: "right" });
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Total TTC : ${formatAmount(quote.totalTTC)} XOF`, 190, finalY + 25, { align: "right" });

        return doc;
    };

    const handleDownloadPDF = () => {
        const doc = generateDoc();
        if (doc) doc.save(`Devis-${quote!.number}.pdf`);
    };

    const handlePrint = () => {
        const doc = generateDoc();
        if (doc) {
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
        }
    };

    const handleValidateQuote = async () => {
        if (!quote) return;
        if (!confirm("Valider ce devis ? Il sera marqué comme Envoyé.")) return;

        try {
            const res = await fetch(`/api/invoices/${quote.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "SENT" }),
            });
            if (res.ok) {
                fetchQuote();
                alert("Devis validé !");
            }
        } catch (e) {
            console.error(e);
            alert("Erreur validation");
        }
    };

    const handleConvertToInvoice = async () => {
        if (!quote) return;
        if (!confirm("Voulez-vous convertir ce devis en facture ? Cela créera une nouvelle facture basée sur ce devis.")) return;

        setIsConverting(true);
        try {
            // Appel API pour conversion (endpoint à créer)
            // Pour l'instant, on va simuler ou appeler une route qui ferait ça.
            // Le mieux est de créer POST /api/quotes/[id]/convert
            const res = await fetch(`/api/quotes/${quote.id}/convert`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
                const newInvoice = await res.json();
                alert("Devis converti avec succès !");
                router.push(`/dashboard/ventes/factures/${newInvoice.id}`);
            } else {
                const err = await res.json();
                alert(err.error || "Erreur conversion");
            }
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la conversion");
        } finally {
            setIsConverting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    if (!quote) return <div className="p-10 text-center">Devis introuvable</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Devis {quote.number}
                            </h1>
                            <Badge className={statusConfig[quote.status]?.color || "bg-gray-100"}>
                                {statusConfig[quote.status]?.label || quote.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Émis le {format(new Date(quote.issueDate), "d MMMM yyyy", { locale: fr })}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {quote.status === "DRAFT" && (
                        <Button onClick={handleValidateQuote} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Check className="mr-2 h-4 w-4" />
                            Valider
                        </Button>
                    )}
                    {quote.status === "SENT" && (
                        <Button onClick={handleConvertToInvoice} disabled={isConverting} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {isConverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileInput className="mr-2 h-4 w-4" />}
                            Convertir en Facture
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleDownloadPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 print:block">
                <div className="lg:col-span-2">
                    <Card className="shadow-lg print:shadow-none print:border-none">
                        <CardContent className="p-8 print:p-0">
                            {/* Header Devis */}
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 rounded-xl">
                                        <FileText className="h-8 w-8 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{quote.company?.name}</h2>
                                        {quote.company?.phone && <div className="text-sm text-muted-foreground">{quote.company.phone}</div>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-lg font-medium text-muted-foreground">DEVIS N°</h3>
                                    <p className="text-2xl font-bold text-slate-900">{quote.number}</p>
                                </div>
                            </div>

                            {/* Lignes */}
                            <div className="border rounded-lg overflow-hidden mb-8">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-600">DESCRIPTION</th>
                                            <th className="px-4 py-3 text-center font-semibold text-slate-600">QTÉ</th>
                                            <th className="px-4 py-3 text-right font-semibold text-slate-600">PRIX U.</th>
                                            <th className="px-4 py-3 text-right font-semibold text-slate-600">TOTAL HT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {quote.lines.map((line) => (
                                            <tr key={line.id}>
                                                <td className="px-4 py-3 font-medium text-slate-900">{line.description}</td>
                                                <td className="px-4 py-3 text-center text-slate-500">x{line.quantity}</td>
                                                <td className="px-4 py-3 text-right text-slate-500">{Number(line.unitPriceHT).toLocaleString("fr-FR")}</td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-900">{Number(line.totalHT).toLocaleString("fr-FR")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totaux */}
                            <div className="flex justify-end">
                                <div className="w-full md:w-5/12 space-y-3">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Sous-total HT</span>
                                        <span>{Number(quote.totalHT).toLocaleString("fr-FR")} XOF</span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between font-bold text-xl text-slate-900">
                                        <span>Total TTC</span>
                                        <span>{Number(quote.totalTTC).toLocaleString("fr-FR")} XOF</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
