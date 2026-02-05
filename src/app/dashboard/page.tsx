"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Users,
    FileText,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from "lucide-react";

interface DashboardStats {
    stats: {
        revenue: number;
        expenses: number;
        bankBalance: number;
        activeClients: number;
    };
    recentInvoices: {
        id: string;
        number: string;
        client: string;
        amount: number;
        status: string;
        date: string;
    }[];
    alerts: {
        type: string;
        message: string;
        count: number;
    }[];
}

const statusColors: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    PARTIALLY_PAID: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    CANCELLED: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<string, string> = {
    PAID: "Payée",
    SENT: "Envoyée",
    PENDING: "En attente",
    PARTIALLY_PAID: "Partiel",
    OVERDUE: "En retard",
    DRAFT: "Brouillon",
    CANCELLED: "Annulée",
};

export default function DashboardPage() {
    const [data, setData] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/dashboard/stats");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Erreur chargement dashboard", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const statsConfig = [
        {
            title: "Chiffre d'affaires",
            value: data?.stats.revenue || 0,
            unit: "XOF",
            change: "+0%", // Pour l'instant on ne calcule pas l'évolution
            trend: "up",
            icon: TrendingUp,
            color: "text-emerald-600",
            bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
        },
        {
            title: "Dépenses",
            value: data?.stats.expenses || 0,
            unit: "XOF",
            change: "0%",
            trend: "down",
            icon: TrendingDown,
            color: "text-amber-600",
            bgColor: "bg-amber-100 dark:bg-amber-900/30",
        },
        {
            title: "Trésorerie (encaissée)",
            value: data?.stats.bankBalance || 0,
            unit: "XOF",
            change: "+0%",
            trend: "up",
            icon: Wallet,
            color: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-900/30",
        },
        {
            title: "Clients actifs",
            value: data?.stats.activeClients || 0,
            unit: "",
            change: "",
            trend: "up",
            icon: Users,
            color: "text-violet-600",
            bgColor: "bg-violet-100 dark:bg-violet-900/30",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
                <p className="text-muted-foreground">
                    Vue d&apos;ensemble de votre activité comptable
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsConfig.map((stat) => (
                    <Card key={stat.title} className="relative overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === "up" ? "text-emerald-600" : "text-red-600"
                                    }`}>
                                    {stat.change}
                                    {stat.trend === "up" ? (
                                        <ArrowUpRight className="h-4 w-4" />
                                    ) : (
                                        <ArrowDownRight className="h-4 w-4" />
                                    )}
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm text-muted-foreground">{stat.title}</p>
                                <p className="text-2xl font-bold mt-1">
                                    {stat.value.toLocaleString("fr-FR")}
                                    {stat.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span>}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Invoices */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Factures récentes</CardTitle>
                            <CardDescription>Les 5 dernières factures émises</CardDescription>
                        </div>
                        <FileText className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.recentInvoices.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">Aucune facture récente</p>
                            ) : (
                                data?.recentInvoices.map((invoice) => (
                                    <Link
                                        href={`/dashboard/ventes/factures/${invoice.id}`}
                                        key={invoice.id}
                                    >
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer mb-2">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-lg bg-background">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{invoice.number}</p>
                                                    <p className="text-sm text-muted-foreground">{invoice.client}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-semibold text-sm">
                                                        {invoice.amount.toLocaleString("fr-FR")} XOF
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(invoice.date), "dd/MM/yyyy", { locale: fr })}
                                                    </p>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status] || "bg-gray-100"}`}>
                                                    {statusLabels[invoice.status] || invoice.status}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts & Reminders */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Alertes</CardTitle>
                            <CardDescription>Actions à effectuer</CardDescription>
                        </div>
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.alerts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Aucune alerte pour le moment.</p>
                            ) : (
                                data?.alerts.map((alert, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border-l-4 ${alert.type === "warning" ? "bg-amber-50 border-amber-500" :
                                            alert.type === "error" ? "bg-red-50 border-red-500" :
                                                "bg-blue-50 border-blue-500"
                                            }`}
                                    >
                                        <p className="text-sm font-medium">{alert.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Actions rapides</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { label: "Nouvelle facture", href: "/dashboard/ventes/factures/nouveau", icon: FileText },
                            { label: "Ajouter un client", href: "/dashboard/ventes/clients/nouveau", icon: Users },
                            { label: "Importer relevé", href: "/dashboard/banque/import", icon: Wallet },
                            { label: "Lancer la paie", href: "/dashboard/paie/bulletins/nouveau", icon: TrendingUp },
                        ].map((action) => (
                            <Link
                                href={action.href}
                                key={action.label}
                                className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent hover:border-accent transition-all text-left group"
                            >
                                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <action.icon className="h-5 w-5 text-primary" />
                                </div>
                                <span className="font-medium text-sm">{action.label}</span>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
