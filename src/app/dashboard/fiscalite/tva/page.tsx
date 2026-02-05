"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    PiggyBank,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    FileText,
    Clock,
} from "lucide-react";
import { useSession } from "next-auth/react";

const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: "Brouillon", color: "bg-slate-100 text-slate-700" },
    ready: { label: "Prête", color: "bg-blue-100 text-blue-700" },
    submitted: { label: "Soumise", color: "bg-amber-100 text-amber-700" },
    paid: { label: "Payée", color: "bg-emerald-100 text-emerald-700" },
};

export default function TVAPage() {
    const { data: session } = useSession();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = React.useState(true);
    const [data, setData] = React.useState({
        currentPeriod: {
            startDate: new Date().toLocaleDateString(),
            endDate: new Date().toLocaleDateString(),
            dueDate: new Date().toLocaleDateString(),
            collected: 0,
            deductible: 0,
            balance: 0,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        previousPeriods: [] as any[],
        stats: {
            collectedYTD: 0,
            deductibleYTD: 0,
            paidYTD: 0
        }
    });

    React.useEffect(() => {
        const fetchData = async () => {
            if (!session?.user?.companyId) return;
            try {
                const res = await fetch(`/api/fiscalite/tva?companyId=${session.user.companyId}`);
                if (res.ok) {
                    const apiData = await res.json();

                    // Format dates
                    const formattedCurrent = {
                        ...apiData.currentPeriod,
                        startDate: new Date(apiData.currentPeriod.startDate).toLocaleDateString('fr-FR'),
                        endDate: new Date(apiData.currentPeriod.endDate).toLocaleDateString('fr-FR'),
                        dueDate: new Date(apiData.currentPeriod.dueDate).toLocaleDateString('fr-FR')
                    };

                    setData({
                        currentPeriod: formattedCurrent,
                        previousPeriods: apiData.history, // Map properly if needed
                        stats: apiData.stats
                    });
                }
            } catch (error) {
                console.error("Failed to fetch TVA data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [session]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">TVA</h1>
                    <p className="text-muted-foreground">
                        Gestion de la TVA collectée et déductible
                    </p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                    <FileText className="mr-2 h-4 w-4" />
                    Générer déclaration
                </Button>
            </div>

            {/* Période en cours */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PiggyBank className="h-5 w-5 text-primary" />
                            Période en cours
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Échéance:</span>
                            <span className="font-semibold text-amber-600">{data.currentPeriod.dueDate}</span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Du {data.currentPeriod.startDate} au {data.currentPeriod.endDate}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                <span className="text-sm text-muted-foreground">TVA Collectée</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-600">
                                {data.currentPeriod.collected.toLocaleString("fr-FR")} XOF
                            </p>
                            <p className="text-xs text-muted-foreground">Sur vos ventes</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-muted-foreground">TVA Déductible</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">
                                {data.currentPeriod.deductible.toLocaleString("fr-FR")} XOF
                            </p>
                            <p className="text-xs text-muted-foreground">Sur vos achats</p>
                        </div>

                        <div className="space-y-2 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                            <div className="flex items-center gap-2">
                                <ArrowUpRight className="h-4 w-4 text-primary" />
                                <span className="text-sm text-muted-foreground">TVA à Payer</span>
                            </div>
                            <p className="text-3xl font-bold text-primary">
                                {data.currentPeriod.balance.toLocaleString("fr-FR")} XOF
                            </p>
                            <p className="text-xs text-muted-foreground">Collectée - Déductible</p>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button variant="outline" size="sm">
                            Voir le détail
                        </Button>
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-700">
                            Préparer la déclaration
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Statistiques */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">TVA collectée (année)</p>
                                <p className="text-2xl font-bold">{data.stats.collectedYTD.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">XOF</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                <TrendingDown className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">TVA déduite (année)</p>
                                <p className="text-2xl font-bold">{data.stats.deductibleYTD.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">XOF</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                                <PiggyBank className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">TVA payée (année)</p>
                                <p className="text-2xl font-bold">{data.stats.paidYTD.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">XOF</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Historique */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Historique des déclarations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-sm text-muted-foreground">
                                    <th className="text-left py-3 px-4 font-medium">Période</th>
                                    <th className="text-right py-3 px-4 font-medium">TVA Collectée</th>
                                    <th className="text-right py-3 px-4 font-medium">TVA Déductible</th>
                                    <th className="text-right py-3 px-4 font-medium">Solde</th>
                                    <th className="text-center py-3 px-4 font-medium">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.previousPeriods.length > 0 ? (
                                    data.previousPeriods.map((period, index) => (
                                        <tr key={index} className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                                            <td className="py-3 px-4 font-medium">{period.period}</td>
                                            <td className="py-3 px-4 text-right text-emerald-600">
                                                +{period.collected.toLocaleString("fr-FR")} XOF
                                            </td>
                                            <td className="py-3 px-4 text-right text-blue-600">
                                                -{period.deductible.toLocaleString("fr-FR")} XOF
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold">
                                                {period.balance.toLocaleString("fr-FR")} XOF
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[period.status]?.color || 'bg-gray-100'}`}>
                                                    {statusConfig[period.status]?.label || period.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                            Aucune déclaration précédente trouvée
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
