"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Plus,
    Search,
    Filter,
    FileText,
    MoreHorizontal,
    Download,
    Trash2,
    Eye,
    Send,
    FileEdit,
    Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Quote {
    id: string;
    number: string;
    client: {
        name: string;
    };
    issueDate: string;
    dueDate: string;
    totalTTC: number;
    status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Brouillon", color: "bg-slate-100 text-slate-700" },
    SENT: { label: "Envoyé", color: "bg-blue-100 text-blue-700" },
    ACCEPTED: { label: "Accepté", color: "bg-emerald-100 text-emerald-700" }, // Correspondra à PAID ou un statut custom
    REJECTED: { label: "Refusé", color: "bg-red-100 text-red-700" },
    EXPIRED: { label: "Expiré", color: "bg-orange-100 text-orange-700" },
    PAID: { label: "Facturé", color: "bg-emerald-100 text-emerald-700" }, // Si converti en facture payée
};

export default function QuotesPage() {
    const { data: session } = useSession();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const fetchQuotes = useCallback(async () => {
        if (!session?.user?.companyId) return;

        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                companyId: session.user.companyId,
                type: "QUOTE"
            });

            if (searchTerm) params.append("search", searchTerm);
            if (statusFilter !== "ALL") params.append("status", statusFilter);

            const res = await fetch(`/api/invoices?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setQuotes(data.invoices);
            }
        } catch (error) {
            console.error("Erreur chargement devis", error);
        } finally {
            setIsLoading(false);
        }
    }, [session, searchTerm, statusFilter]);

    useEffect(() => {
        fetchQuotes();
    }, [fetchQuotes]);

    const deleteQuote = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) return;
        try {
            const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchQuotes();
            } else {
                alert("Erreur lors de la suppression");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Devis</h1>
                    <p className="text-muted-foreground">
                        Gérez vos devis clients et convertissez-les en factures
                    </p>
                </div>
                <Link href="/dashboard/ventes/devis/nouveau">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau devis
                    </Button>
                </Link>
            </div>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un devis, un client..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tous les statuts</SelectItem>
                        <SelectItem value="DRAFT">Brouillon</SelectItem>
                        <SelectItem value="SENT">Envoyé</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Liste */}
            <div className="border rounded-lg bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Numéro</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Date d'émission</TableHead>
                            <TableHead>Échéance</TableHead>
                            <TableHead>Montant TTC</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : quotes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-8 w-8 text-gray-300" />
                                        <p>Aucun devis trouvé</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            quotes.map((quote) => (
                                <TableRow key={quote.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/dashboard/ventes/devis/${quote.id}`} className="hover:underline text-primary">
                                            {quote.number}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{quote.client?.name || "Client inconnu"}</TableCell>
                                    <TableCell>
                                        {format(new Date(quote.issueDate), "dd/MM/yyyy", { locale: fr })}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(quote.dueDate), "dd/MM/yyyy", { locale: fr })}
                                    </TableCell>
                                    <TableCell>{Number(quote.totalTTC).toLocaleString("fr-FR")} XOF</TableCell>
                                    <TableCell>
                                        <Badge className={statusConfig[quote.status]?.color || "bg-gray-100 text-gray-700"}>
                                            {statusConfig[quote.status]?.label || quote.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <Link href={`/dashboard/ventes/devis/${quote.id}`}>
                                                    <DropdownMenuItem>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Voir les détails
                                                    </DropdownMenuItem>
                                                </Link>
                                                {quote.status === "DRAFT" && (
                                                    <DropdownMenuItem className="text-red-600" onClick={() => deleteQuote(quote.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Supprimer
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
