"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Search,
    Filter,
    Download,
    FileText,
    Eye,
    Trash2,
    TrendingDown,
    AlertTriangle,
    Wallet,
    Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useSession } from "next-auth/react";

// Type pour les factures fournisseur
interface Invoice {
    id: string;
    number: string;
    supplier: string;
    receiptDate: string;
    dueDate: string;
    totalTTC: number;
    amountPaid: number;
    status: string;
    hasDocument: boolean;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "En attente", color: "bg-amber-100 text-amber-700" },
    approved: { label: "Validée", color: "bg-blue-100 text-blue-700" },
    partially_paid: { label: "Partiel", color: "bg-orange-100 text-orange-700" },
    paid: { label: "Payée", color: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "Annulée", color: "bg-slate-100 text-slate-500" },
};

export default function SupplierInvoicesPage() {
    const toaster = useToast();
    const { data: session } = useSession();
    const [invoices, setInvoices] = React.useState<Invoice[]>([]);
    const [, setIsLoading] = React.useState(true); // Loading state tracked for UI
    const [searchQuery, setSearchQuery] = React.useState("");

    // État pour le modal de paiement
    const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
    const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);
    const [paymentAmount, setPaymentAmount] = React.useState("");
    const [paymentMethod, setPaymentMethod] = React.useState("BANK_TRANSFER");
    const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Chargement des factures
    const fetchInvoices = React.useCallback(async () => {
        if (!session?.user?.companyId) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                companyId: session.user.companyId,
                limit: "100",
            });
            if (searchQuery) params.append("search", searchQuery);

            const response = await fetch(`/api/suppliers/invoices?${params}`);
            if (response.ok) {
                const data = await response.json();
                setInvoices(data.invoices);
            }
        } catch (error) {
            console.error(error);
            toaster.error("Impossible de charger les factures");
        } finally {
            setIsLoading(false);
        }
    }, [session, searchQuery, toaster]);

    React.useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const filteredInvoices = invoices; // Le filtrage est fait côté serveur via API si searchQuery est utilisé dans fetchInvoices

    const stats = {
        total: invoices.reduce((acc, inv) => acc + inv.totalTTC, 0),
        pending: invoices.filter((inv) => inv.status === "pending").reduce((acc, inv) => acc + inv.totalTTC, 0),
        approved: invoices.filter((inv) => inv.status === "approved").reduce((acc, inv) => acc + inv.totalTTC, 0),
        paid: invoices.filter((inv) => inv.status === "paid").reduce((acc, inv) => acc + inv.totalTTC, 0),
    };

    const openPaymentModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setPaymentAmount((invoice.totalTTC - invoice.amountPaid).toString());
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setIsPaymentOpen(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        setIsSubmitting(true);
        try {
            const amount = parseFloat(paymentAmount);
            if (isNaN(amount) || amount <= 0) throw new Error("Montant invalide");

            if (amount > (selectedInvoice.totalTTC - selectedInvoice.amountPaid)) {
                throw new Error("Le montant dépasse le reste à payer");
            }

            const response = await fetch(`/api/suppliers/invoices/${selectedInvoice.id}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount,
                    paymentDate,
                    paymentMethod,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erreur lors du paiement");
            }

            toaster.success(`Le paiement de ${amount.toLocaleString("fr-FR")} XOF a été enregistré.`);
            setIsPaymentOpen(false);
            fetchInvoices(); // Recharger la liste
        } catch (error) {
            console.error(error);
            toaster.error(error instanceof Error ? error.message : "Erreur lors du paiement");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Factures fournisseurs</h1>
                    <p className="text-muted-foreground">
                        Gérez vos factures d&apos;achats
                    </p>
                </div>
                <Link href="/dashboard/achats/factures/nouveau">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Saisir une facture
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total achats</p>
                        <p className="text-2xl font-bold mt-1">{stats.total.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">XOF</span></p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">En attente</p>
                        <p className="text-2xl font-bold mt-1 text-amber-600">{stats.pending.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">XOF</span></p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">À payer (Validé)</p>
                        <p className="text-2xl font-bold mt-1 text-blue-600">{stats.approved.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">XOF</span></p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Payé</p>
                        <p className="text-2xl font-bold mt-1 text-emerald-600">{stats.paid.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">XOF</span></p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par numéro ou fournisseur..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Exporter
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invoices Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Liste des factures</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-sm text-muted-foreground">
                                    <th className="text-left py-3 px-4 font-medium">Numéro</th>
                                    <th className="text-left py-3 px-4 font-medium">Fournisseur</th>
                                    <th className="text-left py-3 px-4 font-medium">Réception</th>
                                    <th className="text-left py-3 px-4 font-medium">Échéance</th>
                                    <th className="text-right py-3 px-4 font-medium">Montant TTC</th>
                                    <th className="text-right py-3 px-4 font-medium">Reste à payer</th>
                                    <th className="text-center py-3 px-4 font-medium">Statut</th>
                                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((invoice) => (
                                    <tr
                                        key={invoice.id}
                                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-muted">
                                                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <span className="font-medium">{invoice.number}</span>
                                                    {!invoice.hasDocument && (
                                                        <div className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            Sans justificatif
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">{invoice.supplier}</td>
                                        <td className="py-3 px-4 text-muted-foreground">
                                            {new Date(invoice.receiptDate).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground">
                                            {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold">
                                            {invoice.totalTTC.toLocaleString("fr-FR")} XOF
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {(invoice.totalTTC - invoice.amountPaid).toLocaleString("fr-FR")} XOF
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[invoice.status]?.color || "bg-gray-100"}`}>
                                                {statusConfig[invoice.status]?.label || invoice.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-1">
                                                {(invoice.status === "approved" || invoice.status === "partially_paid") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => openPaymentModal(invoice)}
                                                        title="Payer"
                                                    >
                                                        <Wallet className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Link href={`/dashboard/achats/factures/${invoice.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredInvoices.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">Aucune facture trouvée</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de paiement */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enregistrer un paiement</DialogTitle>
                        <DialogDescription>
                            Saisissez les détails du règlement pour la facture {selectedInvoice?.number}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Montant à payer</Label>
                            <div className="relative">
                                <Input
                                    id="amount"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    max={selectedInvoice ? selectedInvoice.totalTTC - selectedInvoice.amountPaid : 0}
                                    required
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    XOF
                                </span>
                            </div>
                            {selectedInvoice && (
                                <p className="text-xs text-muted-foreground">
                                    Reste à payer : {(selectedInvoice.totalTTC - selectedInvoice.amountPaid).toLocaleString("fr-FR")} XOF
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Date de paiement</Label>
                            <Input
                                id="date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="method">Mode de paiement</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK_TRANSFER">Virement Bancaire</SelectItem>
                                    <SelectItem value="CASH">Espèces</SelectItem>
                                    <SelectItem value="CHECK">Chèque</SelectItem>
                                    <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
