"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Search,
    ChevronRight,
    ChevronDown,
    Download,
    FileSpreadsheet,
    FolderTree,
} from "lucide-react";

// Plan comptable SYSCOHADA simplifié
const accountClasses = [
    {
        code: "1",
        label: "RESSOURCES DURABLES",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        accounts: [
            { code: "101000", label: "Capital social", balance: 10000000 },
            { code: "120000", label: "Report à nouveau", balance: 2500000 },
            { code: "131000", label: "Résultat net", balance: 1850000 },
        ],
    },
    {
        code: "2",
        label: "ACTIF IMMOBILISÉ",
        color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
        accounts: [
            { code: "241000", label: "Matériel et outillage", balance: 5200000 },
            { code: "244000", label: "Matériel de transport", balance: 8500000 },
            { code: "245000", label: "Matériel de bureau", balance: 1200000 },
            { code: "281000", label: "Amortissements (contra)", balance: -4500000 },
        ],
    },
    {
        code: "3",
        label: "STOCKS",
        color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        accounts: [
            { code: "311000", label: "Marchandises", balance: 4800000 },
            { code: "321000", label: "Matières premières", balance: 1200000 },
        ],
    },
    {
        code: "4",
        label: "TIERS",
        color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        accounts: [
            { code: "401000", label: "Fournisseurs", balance: -4500000 },
            { code: "411000", label: "Clients", balance: 7200000 },
            { code: "421000", label: "Personnel rémunérations dues", balance: -850000 },
            { code: "431000", label: "CNSS", balance: -320000 },
            { code: "441000", label: "État, impôts sur bénéfices", balance: -450000 },
            { code: "443100", label: "TVA collectée", balance: -1250000 },
            { code: "445000", label: "TVA déductible", balance: 480000 },
        ],
    },
    {
        code: "5",
        label: "TRÉSORERIE",
        color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
        accounts: [
            { code: "512000", label: "Banques comptes courants", balance: 12450000 },
            { code: "531000", label: "Caisse", balance: 850000 },
        ],
    },
    {
        code: "6",
        label: "CHARGES",
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        accounts: [
            { code: "601000", label: "Achats de marchandises", balance: 45000000 },
            { code: "613000", label: "Locations", balance: 3600000 },
            { code: "622000", label: "Honoraires", balance: 1200000 },
            { code: "641000", label: "Rémunérations du personnel", balance: 18000000 },
            { code: "646000", label: "Charges sociales CNSS", balance: 3240000 },
            { code: "681000", label: "Dotations aux amortissements", balance: 1800000 },
        ],
    },
    {
        code: "7",
        label: "PRODUITS",
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        accounts: [
            { code: "701000", label: "Ventes de marchandises", balance: -72000000 },
            { code: "706000", label: "Prestations de services", balance: -12500000 },
            { code: "707000", label: "Produits accessoires", balance: -850000 },
        ],
    },
];

export default function ChartOfAccountsPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [expandedClasses, setExpandedClasses] = React.useState<string[]>(["1", "4", "5"]);

    const toggleClass = (code: string) => {
        setExpandedClasses((prev) =>
            prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
        );
    };

    const filteredClasses = searchQuery
        ? accountClasses.map((cls) => ({
            ...cls,
            accounts: cls.accounts.filter(
                (acc) =>
                    acc.code.includes(searchQuery) ||
                    acc.label.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        })).filter((cls) => cls.accounts.length > 0)
        : accountClasses;

    const formatBalance = (balance: number) => {
        const absBalance = Math.abs(balance);
        const formatted = absBalance.toLocaleString("fr-FR");
        return balance < 0 ? `(${formatted})` : formatted;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Plan comptable</h1>
                    <p className="text-muted-foreground">
                        Plan comptable SYSCOHADA - Exercice 2026
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Balance générale
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un compte (code ou libellé)..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Chart of Accounts */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FolderTree className="h-5 w-5" />
                        Structure des comptes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {filteredClasses.map((accountClass) => (
                            <div key={accountClass.code} className="border rounded-lg overflow-hidden">
                                {/* Class Header */}
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => toggleClass(accountClass.code)}
                                >
                                    <div className="flex items-center gap-3">
                                        {expandedClasses.includes(accountClass.code) ? (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${accountClass.color}`}>
                                            Classe {accountClass.code}
                                        </span>
                                        <span className="font-semibold">{accountClass.label}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {accountClass.accounts.length} comptes
                                    </div>
                                </div>

                                {/* Accounts List */}
                                {expandedClasses.includes(accountClass.code) && (
                                    <div className="border-t bg-muted/30">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-xs text-muted-foreground">
                                                    <th className="text-left py-2 px-4 font-medium">Code</th>
                                                    <th className="text-left py-2 px-4 font-medium">Libellé</th>
                                                    <th className="text-right py-2 px-4 font-medium">Solde</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accountClass.accounts.map((account) => (
                                                    <tr
                                                        key={account.code}
                                                        className="border-t border-muted hover:bg-muted/50 cursor-pointer transition-colors"
                                                    >
                                                        <td className="py-3 px-4">
                                                            <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                                                                {account.code}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">{account.label}</td>
                                                        <td className={`py-3 px-4 text-right font-semibold ${account.balance < 0 ? "text-red-600" : ""
                                                            }`}>
                                                            {formatBalance(account.balance)} XOF
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {filteredClasses.length === 0 && (
                        <div className="text-center py-12">
                            <FolderTree className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">Aucun compte trouvé</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
