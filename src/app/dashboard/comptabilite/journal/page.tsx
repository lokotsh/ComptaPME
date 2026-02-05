"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Filter,
    BookOpen,
    Eye,
    Edit,
    CheckCircle2,
    XCircle,
    Download,
} from "lucide-react";

// Types de journaux
const journalTypes = [
    { code: "VE", label: "Ventes", color: "bg-emerald-100 text-emerald-700" },
    { code: "AC", label: "Achats", color: "bg-violet-100 text-violet-700" },
    { code: "BQ", label: "Banque", color: "bg-blue-100 text-blue-700" },
    { code: "CA", label: "Caisse", color: "bg-amber-100 text-amber-700" },
    { code: "OD", label: "Opérations diverses", color: "bg-slate-100 text-slate-700" },
];

// Données simulées - Écritures comptables
const journalEntries = [
    {
        id: "1",
        reference: "VE-2026-0145",
        date: "15/01/2026",
        journal: "VE",
        description: "Facture client FAC-2026-001 - SARL TechBenin",
        debit: 1475000,
        credit: 1475000,
        isValidated: true,
        lines: [
            { account: "411000", label: "Clients", debit: 1475000, credit: 0 },
            { account: "701000", label: "Ventes de marchandises", debit: 0, credit: 1250000 },
            { account: "443100", label: "TVA collectée", debit: 0, credit: 225000 },
        ],
    },
    {
        id: "2",
        reference: "AC-2026-0089",
        date: "14/01/2026",
        journal: "AC",
        description: "Facture fournisseur SOBEMAP-2026-0145",
        debit: 850000,
        credit: 850000,
        isValidated: true,
        lines: [
            { account: "601000", label: "Achats de marchandises", debit: 720339, credit: 0 },
            { account: "445000", label: "TVA déductible", debit: 129661, credit: 0 },
            { account: "401000", label: "Fournisseurs", debit: 0, credit: 850000 },
        ],
    },
    {
        id: "3",
        reference: "BQ-2026-0034",
        date: "12/01/2026",
        journal: "BQ",
        description: "Encaissement client Mobile Money",
        debit: 250000,
        credit: 250000,
        isValidated: false,
        lines: [
            { account: "512000", label: "Banque", debit: 250000, credit: 0 },
            { account: "411000", label: "Clients", debit: 0, credit: 250000 },
        ],
    },
    {
        id: "4",
        reference: "CA-2026-0012",
        date: "10/01/2026",
        journal: "CA",
        description: "Vente au comptant - Caisse",
        debit: 35000,
        credit: 35000,
        isValidated: true,
        lines: [
            { account: "531000", label: "Caisse", debit: 35000, credit: 0 },
            { account: "701000", label: "Ventes de marchandises", debit: 0, credit: 29661 },
            { account: "443100", label: "TVA collectée", debit: 0, credit: 5339 },
        ],
    },
    {
        id: "5",
        reference: "OD-2026-0008",
        date: "08/01/2026",
        journal: "OD",
        description: "Amortissement mensuel immobilisations",
        debit: 180000,
        credit: 180000,
        isValidated: false,
        lines: [
            { account: "681000", label: "Dotations aux amortissements", debit: 180000, credit: 0 },
            { account: "281000", label: "Amortissements des immobilisations", debit: 0, credit: 180000 },
        ],
    },
];

export default function JournalPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedJournal, setSelectedJournal] = React.useState<string | null>(null);
    const [expandedEntry, setExpandedEntry] = React.useState<string | null>(null);

    const filteredEntries = journalEntries.filter((entry) => {
        const matchesSearch =
            entry.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesJournal = !selectedJournal || entry.journal === selectedJournal;
        return matchesSearch && matchesJournal;
    });

    const getJournalStyle = (code: string) => {
        return journalTypes.find((j) => j.code === code)?.color || "bg-slate-100 text-slate-700";
    };

    const getJournalLabel = (code: string) => {
        return journalTypes.find((j) => j.code === code)?.label || code;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Journal comptable</h1>
                    <p className="text-muted-foreground">
                        Écritures de l&apos;exercice 2026
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export FEC
                    </Button>
                    <Link href="/dashboard/comptabilite/journal/nouveau">
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvelle écriture
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Journal Type Filters */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={selectedJournal === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedJournal(null)}
                >
                    Tous les journaux
                </Button>
                {journalTypes.map((journal) => (
                    <Button
                        key={journal.code}
                        variant={selectedJournal === journal.code ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedJournal(journal.code)}
                    >
                        {journal.label}
                    </Button>
                ))}
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher une écriture..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Journal Entries */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Écritures ({filteredEntries.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredEntries.map((entry) => (
                            <div
                                key={entry.id}
                                className="border rounded-lg overflow-hidden"
                            >
                                {/* Entry Header */}
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getJournalStyle(entry.journal)}`}>
                                            {getJournalLabel(entry.journal)}
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{entry.reference}</span>
                                                {entry.isValidated ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-amber-500" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{entry.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">{entry.date}</p>
                                            <p className="font-semibold">{entry.debit.toLocaleString("fr-FR")} XOF</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {!entry.isValidated && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Entry Lines (Expandable) */}
                                {expandedEntry === entry.id && (
                                    <div className="border-t bg-muted/30 p-4">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-muted-foreground">
                                                    <th className="text-left py-2 font-medium">Compte</th>
                                                    <th className="text-left py-2 font-medium">Libellé</th>
                                                    <th className="text-right py-2 font-medium">Débit</th>
                                                    <th className="text-right py-2 font-medium">Crédit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {entry.lines.map((line, index) => (
                                                    <tr key={index} className="border-t border-muted">
                                                        <td className="py-2 font-mono text-xs">{line.account}</td>
                                                        <td className="py-2">{line.label}</td>
                                                        <td className="py-2 text-right">
                                                            {line.debit > 0 ? line.debit.toLocaleString("fr-FR") : "-"}
                                                        </td>
                                                        <td className="py-2 text-right">
                                                            {line.credit > 0 ? line.credit.toLocaleString("fr-FR") : "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t font-semibold">
                                                    <td colSpan={2} className="py-2">Total</td>
                                                    <td className="py-2 text-right">{entry.debit.toLocaleString("fr-FR")}</td>
                                                    <td className="py-2 text-right">{entry.credit.toLocaleString("fr-FR")}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {filteredEntries.length === 0 && (
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">Aucune écriture trouvée</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
