"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Download,
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    Calendar,
    ArrowRight,
    FileSpreadsheet,
    BookOpen,
} from "lucide-react";

const reports = [
    {
        id: "balance-sheet",
        title: "Bilan",
        description: "Situation patrimoniale de l'entreprise",
        icon: FileSpreadsheet,
        color: "bg-blue-100 text-blue-600",
        href: "/dashboard/rapports/bilan",
    },
    {
        id: "income-statement",
        title: "Compte de résultat",
        description: "Performance économique de l'exercice",
        icon: TrendingUp,
        color: "bg-emerald-100 text-emerald-600",
        href: "/dashboard/rapports/resultat",
    },
    {
        id: "trial-balance",
        title: "Balance générale",
        description: "Soldes de tous les comptes",
        icon: BookOpen,
        color: "bg-violet-100 text-violet-600",
        href: "/dashboard/rapports/balance",
    },
    {
        id: "general-ledger",
        title: "Grand livre",
        description: "Historique des mouvements par compte",
        icon: FileText,
        color: "bg-amber-100 text-amber-600",
        href: "/dashboard/rapports/grand-livre",
    },
    {
        id: "cash-flow",
        title: "Tableau des flux de trésorerie",
        description: "Mouvements de trésorerie de l'exercice",
        icon: TrendingDown,
        color: "bg-sky-100 text-sky-600",
        href: "/dashboard/rapports/tresorerie",
    },
    {
        id: "vat-report",
        title: "Déclaration TVA",
        description: "État de la TVA collectée et déductible",
        icon: PieChart,
        color: "bg-red-100 text-red-600",
        href: "/dashboard/rapports/tva",
    },
];

const quickStats = {
    revenue: 84500000,
    expenses: 72840000,
    profit: 11660000,
    profitMargin: 13.8,
};

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Rapports financiers</h1>
                    <p className="text-muted-foreground">
                        États financiers et rapports de gestion
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Calendar className="mr-2 h-4 w-4" />
                        Exercice 2026
                    </Button>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                        <Download className="mr-2 h-4 w-4" />
                        Exporter tout
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Chiffre d&apos;affaires</p>
                                <p className="text-xl font-bold">{(quickStats.revenue / 1000000).toFixed(1)}M <span className="text-sm font-normal">XOF</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <TrendingDown className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Charges</p>
                                <p className="text-xl font-bold">{(quickStats.expenses / 1000000).toFixed(1)}M <span className="text-sm font-normal">XOF</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Résultat net</p>
                                <p className="text-xl font-bold">{(quickStats.profit / 1000000).toFixed(1)}M <span className="text-sm font-normal">XOF</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20 border-violet-200/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-500/10">
                                <PieChart className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Marge nette</p>
                                <p className="text-xl font-bold">{quickStats.profitMargin}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reports Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => (
                    <Card key={report.id} className="group hover:shadow-lg hover:border-primary/50 transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${report.color}`}>
                                    <report.icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-1">{report.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                                    <div className="flex gap-2">
                                        <Link href={report.href} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full group-hover:border-primary group-hover:text-primary">
                                                Consulter
                                                <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Reports */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Rapports récents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[
                            { name: "Balance générale Décembre 2025", date: "02/01/2026", format: "PDF" },
                            { name: "Compte de résultat T4 2025", date: "31/12/2025", format: "Excel" },
                            { name: "Déclaration TVA Novembre 2025", date: "15/12/2025", format: "PDF" },
                            { name: "Bilan Exercice 2025", date: "10/12/2025", format: "PDF" },
                        ].map((report, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{report.name}</p>
                                        <p className="text-xs text-muted-foreground">Généré le {report.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{report.format}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
