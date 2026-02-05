"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
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
    CreditCard,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Ban,
    Send,
    FileText,
    Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface InvoiceLine {
    id: string;
    description: string;
    quantity: number;
    unitPriceHT: number;
    totalHT: number;
    tvaRate: number;
    tvaGroup?: string;
}

interface Invoice {
    id: string;
    number: string;
    issueDate: string;
    dueDate: string;
    status: string;
    notes?: string;
    // MECeF Fields
    mecefNim?: string;
    mecefCounters?: string;
    mecefDtc?: string;
    mecefQrCode?: string;
    mecefSignature?: string;
    mecefType?: string;

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
    amountPaid: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    DRAFT: { label: "Brouillon", color: "bg-slate-100 text-slate-700", icon: Edit },
    SENT: { label: "Envoyée", color: "bg-blue-100 text-blue-700", icon: Send },
    PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock },
    PARTIAL: { label: "Partiel", color: "bg-orange-100 text-orange-700", icon: Clock },
    PAID: { label: "Payée", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    OVERDUE: { label: "En retard", color: "bg-red-100 text-red-700", icon: AlertCircle },
    CANCELLED: { label: "Annulée", color: "bg-slate-100 text-slate-500", icon: Ban },
};

export default function InvoiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [invoice, setInvoice] = React.useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);

    // États pour le paiement
    const [paymentAmount, setPaymentAmount] = React.useState("");
    const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = React.useState("CASH");
    const [paymentReference, setPaymentReference] = React.useState("");
    const [paymentNotes, setPaymentNotes] = React.useState("");

    const fetchInvoice = React.useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/invoices/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setInvoice(data);
                // Pré-remplir le montant restant par défaut
                if (data) {
                    const remaining = Number(data.totalTTC) - Number(data.amountPaid || 0);
                    setPaymentAmount(remaining.toString());
                }
            } else {
                console.error("Facture introuvable");
            }
        } catch (error) {
            console.error("Erreur chargement facture", error);
        } finally {
            setIsLoading(false);
        }
    }, [params.id]);

    React.useEffect(() => {
        if (session) {
            fetchInvoice();
        }
    }, [session, fetchInvoice]);

    // Fonction générique pour créer le document PDF
    const generateInvoiceDoc = async () => {
        if (!invoice) return null;
        const doc = new jsPDF();

        // Helper pour formater les montants
        const formatAmount = (amount: number | string) => {
            const num = Number(amount);
            if (isNaN(num)) return "0";
            return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        };

        // --- EN-TÊTE ---
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(invoice.company?.name || "Ma Société", 20, 25);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        let yPos = 32;
        if (invoice.company?.address) { doc.text(invoice.company.address, 20, yPos); yPos += 5; }
        if (invoice.company?.phone) { doc.text(`Tél: ${invoice.company.phone}`, 20, yPos); yPos += 5; }
        if (invoice.company?.email) { doc.text(invoice.company.email, 20, yPos); yPos += 5; }
        if (invoice.company?.ifu) { doc.text(`IFU: ${invoice.company.ifu}`, 20, yPos); yPos += 5; }

        doc.setFontSize(30);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(200, 200, 200);
        const title = invoice.mecefType === 'FA' ? "AVOIR" : "FACTURE";
        doc.text(title, 190, 30, { align: "right" });

        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        doc.text(`N° ${invoice.number}`, 190, 40, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Date : ${format(new Date(invoice.issueDate), "dd/MM/yyyy")}`, 190, 46, { align: "right" });
        if (invoice.dueDate) {
            doc.text(`Échéance : ${format(new Date(invoice.dueDate), "dd/MM/yyyy")}`, 190, 52, { align: "right" });
        }

        // --- MECeF Info Header ---
        if (invoice.mecefNim) {
            doc.setFontSize(8);
            doc.setTextColor(50, 50, 50);
            doc.text(`NIM: ${invoice.mecefNim}`, 190, 60, { align: "right" });
            doc.text(`MECeF Compteurs: ${invoice.mecefCounters || '-'}`, 190, 64, { align: "right" });
        }

        // --- INFO CLIENT ---
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(20, 70, 80, 35, 2, 2, "F");

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Facturer à :", 25, 77);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(invoice.client.name, 25, 83);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        let clientY = 89;
        if (invoice.client.address) { doc.text(invoice.client.address, 25, clientY); clientY += 5; }
        if (invoice.client.phone) { doc.text(invoice.client.phone, 25, clientY); clientY += 5; }
        if (invoice.client.ifu) { doc.text(`IFU: ${invoice.client.ifu}`, 25, clientY); }

        // --- TABLEAU ---
        const tableColumn = ["Description", "Qté", "Prix U. (XOF)", "TVA", "Total HT (XOF)"];
        const tableRows = invoice.lines.map(line => [
            line.description,
            line.quantity.toString(),
            formatAmount(line.unitPriceHT),
            `${Number(line.tvaRate)}% (Gr: ${line.tvaGroup || 'B'})`,
            formatAmount(line.totalHT)
        ]);

        autoTable(doc, {
            startY: 115,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center' }
            },
            styles: {
                font: "helvetica",
                fontSize: 10,
                cellPadding: 3,
                valign: 'middle'
            }
        });

        // --- TOTAUX ---
        // @ts-ignore
        const finalY = doc.lastAutoTable.finalY + 10;
        const startXStats = 120;

        doc.setDrawColor(200, 200, 200);
        doc.line(startXStats, finalY, 190, finalY);

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);

        doc.text("Sous-total HT :", startXStats, finalY + 8);
        doc.text(`${formatAmount(invoice.totalHT)} XOF`, 190, finalY + 8, { align: "right" });

        doc.text(`TVA :`, startXStats, finalY + 14);
        doc.text(`${formatAmount(invoice.totalTVA)} XOF`, 190, finalY + 14, { align: "right" });

        doc.setLineWidth(0.5);
        doc.line(startXStats, finalY + 18, 190, finalY + 18);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Total TTC :", startXStats, finalY + 25);
        doc.text(`${formatAmount(invoice.totalTTC)} XOF`, 190, finalY + 25, { align: "right" });

        // --- MECeF Details sur PDF (Boxed) ---
        if (invoice.mecefNim && invoice.mecefQrCode) {
            const boxY = finalY + 35;
            const boxHeight = 40;
            const boxWidth = 170;
            const boxX = 20;

            // Draw Box
            doc.setDrawColor(30, 64, 175); // Blue-700
            doc.setLineWidth(0.5);
            doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, "S");

            // Title
            doc.setTextColor(30, 64, 175);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("FACTURE NORMALISÉE (MECeF)", boxX + 5, boxY + 7);

            // Details
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            doc.setFont("courier", "normal");

            doc.text(`NIM: ${invoice.mecefNim}`, boxX + 5, boxY + 14);
            doc.text(`Compteurs: ${invoice.mecefCounters || '-'}`, boxX + 5, boxY + 19);
            doc.text(`Signature: ${invoice.mecefSignature?.substring(0, 40) || '-'}...`, boxX + 5, boxY + 24);
            doc.text(`Date: ${invoice.mecefDtc || '-'}`, boxX + 5, boxY + 29);

            // QR Code
            try {
                const qrCodeDataUrl = await QRCode.toDataURL(invoice.mecefQrCode);
                doc.addImage(qrCodeDataUrl, 'PNG', boxX + 135, boxY + 5, 30, 30);
            } catch (err) {
                console.error("Erreur QR Code client:", err);
            }
        }

        // --- PIED DE PAGE ---
        if (invoice.notes) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100, 100, 100);
            // Move below MECeF box if it exists
            const notesY = invoice.mecefNim ? finalY + 85 : finalY + 40;
            const splitNotes = doc.splitTextToSize(`Notes : ${invoice.notes}`, 170);
            doc.text(splitNotes, 20, notesY);
        }

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        const footerText = "Facture normalisée conforme à la réglementation en vigueur au Bénin.";
        doc.text(footerText, 105, 280, { align: "center" });
        doc.text("Merci de votre confiance.", 105, 285, { align: "center" });

        return doc;
    };

    const handlePrint = async () => {
        const doc = await generateInvoiceDoc();
        if (doc) {
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
        }
    };

    const handleSendEmail = () => {
        if (!invoice?.client?.email) {
            alert("Le client n'a pas d'adresse email renseignée.");
            return;
        }
        const subject = `Votre facture ${invoice.number} de ${invoice.company.name}`;
        const body = `Bonjour,\n\nVeuillez trouver ci-joint votre facture ${invoice.number} d'un montant de ${Number(invoice.totalTTC).toLocaleString("fr-FR")} XOF.\n\nCordialement,\n${invoice.company.name}`;
        window.location.href = `mailto:${invoice.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleDownloadPDF = async () => {
        const doc = await generateInvoiceDoc();
        if (doc) {
            doc.save(`Facture-${invoice!.number}.pdf`);
        }
    };

    const handleRecordPayment = async () => {
        if (!invoice) return;
        setIsProcessingPayment(true);
        try {
            const res = await fetch(`/api/invoices/${invoice.id}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: Number(paymentAmount),
                    paymentDate: paymentDate,
                    paymentMethod: paymentMethod,
                    reference: paymentReference,
                    notes: paymentNotes
                })
            });

            if (res.ok) {
                setIsPaymentModalOpen(false);
                fetchInvoice();
                // Reset form
                setPaymentAmount("");
                setPaymentReference("");
                setPaymentNotes("");
                alert("Paiement enregistré avec succès !");
            } else {
                const err = await res.json();
                alert(err.error || "Erreur lors de l'enregistrement du paiement");
            }
        } catch (error) {
            console.error(error);
            alert("Erreur technique lors de l'enregistrement");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="container mx-auto py-10 text-center">
                <h2 className="text-2xl font-bold mb-4">Facture introuvable</h2>
                <Link href="/dashboard/ventes/factures">
                    <Button>Retour à la liste</Button>
                </Link>
            </div>
        );
    }

    const StatusIcon = statusConfig[invoice.status]?.icon || AlertCircle;
    const remainingAmount = Number(invoice.totalTTC) - Number(invoice.amountPaid || 0);

    const handleValidateInvoice = async () => {
        if (!invoice) return;

        if (!confirm("Voulez-vous vraiment valider cette facture ? Elle ne pourra plus être modifiée.")) {
            return;
        }

        try {
            const res = await fetch(`/api/invoices/${invoice.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "SENT" }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Erreur lors de la validation");
            }

            // Rafraîchir les données
            fetchInvoice();
            alert("Facture validée avec succès !");
        } catch (error) {
            console.error(error);
            alert("Impossible de valider la facture.");
        }
    };

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
                                Facture {invoice.number}
                            </h1>
                            <Badge className={statusConfig[invoice.status]?.color || "bg-gray-100"}>
                                {statusConfig[invoice.status]?.label || invoice.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Créée le {format(new Date(invoice.issueDate), "d MMMM yyyy", { locale: fr })}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {invoice.status === "DRAFT" && (
                        <Button onClick={handleValidateInvoice} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Check className="mr-2 h-4 w-4" />
                            Valider
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
                    <Button variant="outline" onClick={handleSendEmail}>
                        <Mail className="mr-2 h-4 w-4" />
                        Envoyer
                    </Button>
                    {invoice.status !== "PAID" && invoice.status !== "DRAFT" && invoice.status !== "CANCELLED" && (
                        <Button onClick={() => setIsPaymentModalOpen(true)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Enregistrer un paiement
                        </Button>
                    )}
                </div>
            </div>
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-emerald-600 to-green-700">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Enregistrer un paiement
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Enregistrer un paiement</DialogTitle>
                        <DialogDescription>
                            Ajoutez un règlement pour la facture {invoice.number}.
                            Reste à payer : {remainingAmount.toLocaleString("fr-FR")} XOF
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Montant</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="method" className="text-right">Méthode</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Mode de paiement" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Espèces</SelectItem>
                                    <SelectItem value="BANK_TRANSFER">Virement Bancaire</SelectItem>
                                    <SelectItem value="CHECK">Chèque</SelectItem>
                                    <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                                    <SelectItem value="CARD">Carte Bancaire</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="ref" className="text-right">Référence</Label>
                            <Input
                                id="ref"
                                placeholder="Ex: Virement #12345"
                                value={paymentReference}
                                onChange={(e) => setPaymentReference(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Annuler</Button>
                        <Button type="button" onClick={handleRecordPayment} disabled={isProcessingPayment}>
                            {isProcessingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <div className="grid gap-6 lg:grid-cols-3 print:block">
                {/* Colonne gauche : Facture */}
                <div className="lg:col-span-2">
                    <Card className="shadow-lg print:shadow-none print:border-none">
                        <CardContent className="p-8 print:p-0">
                            {/* Header Facture */}
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 rounded-xl">
                                        <FileText className="h-8 w-8 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{invoice.company?.name}</h2>
                                        {invoice.company?.address && <p className="text-sm text-muted-foreground">{invoice.company.address}</p>}
                                        {invoice.company?.phone && <div className="flex items-center text-sm text-muted-foreground mt-1"><Phone className="h-3 w-3 mr-1" />{invoice.company.phone}</div>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-lg font-medium text-muted-foreground">FACTURE N°</h3>
                                    <p className="text-2xl font-bold text-slate-900">{invoice.number}</p>
                                </div>
                            </div>

                            {/* Adresses */}
                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Facturer à</h4>
                                    <p className="font-bold text-lg text-slate-900">{invoice.client.name}</p>
                                    <div className="text-sm text-slate-500 space-y-1 mt-1">
                                        {invoice.client.address && <p>{invoice.client.address}</p>}
                                        {invoice.client.email && <p>{invoice.client.email}</p>}
                                        {invoice.client.phone && <p>{invoice.client.phone}</p>}
                                        {invoice.client.ifu && <p>IFU: {invoice.client.ifu}</p>}
                                    </div>
                                </div>
                                <div className="text-right md:text-left md:pl-12">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Date d&apos;émission</h4>
                                            <p className="font-medium">{format(new Date(invoice.issueDate), "dd/MM/yyyy")}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Date d&apos;échéance</h4>
                                            <p className="font-medium">{format(new Date(invoice.dueDate), "dd/MM/yyyy")}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lignes Facture */}
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
                                        {invoice.lines.map((line) => (
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
                                        <span>{Number(invoice.totalHT).toLocaleString("fr-FR")} XOF</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>TVA ({invoice.lines[0]?.tvaRate}%)</span>
                                        <span>{Number(invoice.totalTVA).toLocaleString("fr-FR")} XOF</span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between font-bold text-xl text-slate-900">
                                        <span>Total TTC</span>
                                        <span>{Number(invoice.totalTTC).toLocaleString("fr-FR")} XOF</span>
                                    </div>
                                    {invoice.amountPaid > 0 && (
                                        <div className="flex justify-between text-emerald-600 font-medium">
                                            <span>Déjà payé</span>
                                            <span>- {Number(invoice.amountPaid).toLocaleString("fr-FR")} XOF</span>
                                        </div>
                                    )}
                                    {invoice.amountPaid > 0 && (
                                        <div className="border-t pt-3 flex justify-between font-bold text-lg text-indigo-600">
                                            <span>Reste à payer</span>
                                            <span>{(Number(invoice.totalTTC) - Number(invoice.amountPaid)).toLocaleString("fr-FR")} XOF</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {invoice.notes && (
                                <div className="mt-8 pt-8 border-t">
                                    <h4 className="text-sm font-semibold mb-2">Notes & Conditions</h4>
                                    <p className="text-sm text-slate-500">{invoice.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Colonne droite : Sidebar (Activité, Aide) */}
                <div className="space-y-6 print:hidden">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Activité</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4 text-sm">
                                <li className="flex gap-3">
                                    <div className="mt-0.5 h-2 w-2 rounded-full bg-slate-300 shrink-0" />
                                    <span className="text-slate-600">Facture créée le {format(new Date(invoice.issueDate), "dd/MM/yyyy HH:mm")}</span>
                                </li>
                                {invoice.status === 'SENT' && (
                                    <li className="flex gap-3">
                                        <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                        <span className="text-slate-600">Marquée comme envoyée</span>
                                    </li>
                                )}
                                {invoice.amountPaid > 0 && (
                                    <li className="flex gap-3">
                                        <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                        <span className="text-slate-600">Paiement reçu de {Number(invoice.amountPaid).toLocaleString("fr-FR")} XOF</span>
                                    </li>
                                )}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-blue-900 mb-2">Besoin d&apos;aide ?</h3>
                            <p className="text-sm text-blue-700 leading-relaxed">
                                Contactez le support si vous avez des questions sur cette facture ou si vous souhaitez modifier son statut manuellement.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
