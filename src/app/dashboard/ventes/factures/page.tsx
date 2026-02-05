"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Filter,
    Download,
    FileText,
    Eye,
    Send,
    Loader2,
    Trash2
} from "lucide-react";

interface Invoice {
    id: string;
    number: string;
    client: { name: string };
    issueDate: string;
    dueDate: string;
    totalTTC: number;
    status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Brouillon", color: "bg-slate-100 text-slate-700" },
    SENT: { label: "Envoyée", color: "bg-blue-100 text-blue-700" },
    PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700" },
    PARTIAL: { label: "Partiel", color: "bg-orange-100 text-orange-700" },
    PAID: { label: "Payée", color: "bg-emerald-100 text-emerald-700" },
    OVERDUE: { label: "En retard", color: "bg-red-100 text-red-700" },
    CANCELLED: { label: "Annulée", color: "bg-slate-100 text-slate-500" },
};

export default function FacturesPage() {
    const { data: session } = useSession();
    const [invoices, setInvoices] = React.useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");

    const fetchInvoices = React.useCallback(async () => {
        if (!session?.user?.companyId) return;

        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                companyId: session.user.companyId,
            });
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/invoices?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setInvoices(data.invoices || []);
            }
        } catch (error) {
            console.error("Erreur chargement factures", error);
        } finally {
            setIsLoading(false);
        }
    }, [session, searchQuery]);

    React.useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const stats = {
        total: invoices.reduce((acc, inv) => acc + Number(inv.totalTTC || 0), 0),
        paid: invoices.filter((inv) => inv.status === "PAID").reduce((acc, inv) => acc + Number(inv.totalTTC || 0), 0),
        pending: invoices.filter((inv) => ["SENT", "PENDING", "PARTIAL"].includes(inv.status)).reduce((acc, inv) => acc + Number(inv.totalTTC || 0), 0),
        overdue: invoices.filter((inv) => inv.status === "OVERDUE").reduce((acc, inv) => acc + Number(inv.totalTTC || 0), 0),
    };

    const handleExport = async () => {
        if (!session?.user?.companyId) return;
        try {
            const response = await fetch(`/api/invoices/export?companyId=${session.user.companyId}`);
            if (!response.ok) throw new Error("Erreur export");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `factures_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Erreur export:", error);
        }
    };

    const deleteInvoice = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;
        try {
            const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchInvoices(); // Rafraîchir la liste
            } else {
                alert("Erreur lors de la suppression");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const markAsSent = async (id: string) => {
        if (!confirm("Confirmer la validation de la facture ? Elle ne sera plus modifiable.")) return;
        try {
            const res = await fetch(`/api/invoices/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "SENT" }),
            });
            if (res.ok) {
                fetchInvoices();
            } else {
                alert("Impossible de valider la facture");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Factures clients</h1>
                    <p className="text-muted-foreground">
                        Gérez vos factures de vente
                    </p>
                </div>
                <Link href="/dashboard/ventes/factures/nouveau">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle facture
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total facturé</p>
                        <p className="text-2xl font-bold mt-1">{stats.total.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">XOF</span></p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Encaissé</p>
                        <p className="text-2xl font-bold mt-1 text-emerald-600">{stats.paid.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">XOF</span></p>
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
                        <p className="text-sm text-muted-foreground">En retard</p>
                        <p className="text-2xl font-bold mt-1 text-red-600">{stats.overdue.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">XOF</span></p>
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
                                placeholder="Rechercher par numéro ou client..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" onClick={handleExport}>
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
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-sm text-muted-foreground">
                                        <th className="text-left py-3 px-4 font-medium">Numéro</th>
                                        <th className="text-left py-3 px-4 font-medium">Client</th>
                                        <th className="text-left py-3 px-4 font-medium">Date</th>
                                        <th className="text-left py-3 px-4 font-medium">Échéance</th>
                                        <th className="text-right py-3 px-4 font-medium">Montant TTC</th>
                                        <th className="text-center py-3 px-4 font-medium">Statut</th>
                                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12">
                                                <div className="flex flex-col items-center">
                                                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                                    <p className="text-muted-foreground">Aucune facture trouvée</p>
                                                    <Link href="/dashboard/ventes/factures/nouveau" className="mt-4">
                                                        <Button variant="outline">Créer votre première facture</Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((invoice) => (
                                            <tr
                                                key={invoice.id}
                                                className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-muted">
                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <Link href={`/dashboard/ventes/factures/${invoice.id}`} className="font-medium hover:underline">
                                                            {invoice.number}
                                                        </Link>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">{invoice.client?.name || "Client inconnu"}</td>
                                                <td className="py-3 px-4 text-muted-foreground">
                                                    {format(new Date(invoice.issueDate), "dd/MM/yyyy")}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">
                                                    {format(new Date(invoice.dueDate), "dd/MM/yyyy")}
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold">
                                                    {Number(invoice.totalTTC).toLocaleString("fr-FR")} XOF
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[invoice.status]?.color || "bg-gray-100 text-gray-700"}`}>
                                                        {statusConfig[invoice.status]?.label || invoice.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {invoice.status === "DRAFT" && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                    title="Valider la facture"
                                                                    onClick={() => markAsSent(invoice.id)}
                                                                >
                                                                    <Send className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    title="Supprimer"
                                                                    onClick={() => deleteInvoice(invoice.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Link href={`/dashboard/ventes/factures/${invoice.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir détails">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
