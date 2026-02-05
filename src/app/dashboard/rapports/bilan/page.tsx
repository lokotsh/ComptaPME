"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Download,
    FileSpreadsheet,
    TrendingUp,
    TrendingDown,
    ArrowRight,
} from "lucide-react";

import { useSession } from "next-auth/react";

export default function BalanceSheetPage() {
    const { data: session } = useSession();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = React.useState(true);
    const [bilanData, setBilanData] = React.useState({
        date: new Date().toLocaleDateString("fr-FR"),
        actif: {
            immobilise: [
                { label: "Immobilisations incorporelles", brut: 0, amort: 0 },
                { label: "Immobilisations corporelles", brut: 0, amort: 0 },
            ],
            circulant: [
                { label: "Stocks", brut: 0, amort: 0 },
                { label: "Créances clients", brut: 0, amort: 0 },
                { label: "Autres créances", brut: 0, amort: 0 },
            ],
            tresorerie: [
                { label: "Banques", brut: 0, amort: 0 },
                { label: "Caisse", brut: 0, amort: 0 },
            ],
        },
        passif: {
            capitauxPropres: [
                { label: "Capital social", montant: 0 },
                { label: "Réserves", montant: 0 },
                { label: "Résultat de l'exercice", montant: 0 },
            ],
            dettes: [
                { label: "Dettes fournisseurs", montant: 0 },
                { label: "Dettes fiscales et sociales", montant: 0 },
                { label: "Autres dettes", montant: 0 },
            ],
        },
    });

    React.useEffect(() => {
        const fetchData = async () => {
            if (!session?.user?.companyId) return;
            try {
                const res = await fetch(`/api/reports/balance-sheet?companyId=${session.user.companyId}`);
                if (res.ok) {
                    const data = await res.json();
                    setBilanData(data);
                }
            } catch (error) {
                console.error("Failed to fetch balance sheet", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [session]);
    // Calculs
    const actifImmobilise = bilanData.actif.immobilise.reduce(
        (acc, item) => ({
            brut: acc.brut + item.brut,
            amort: acc.amort + item.amort,
            net: acc.net + (item.brut - item.amort),
        }),
        { brut: 0, amort: 0, net: 0 }
    );

    const actifCirculant = bilanData.actif.circulant.reduce(
        (acc, item) => ({
            brut: acc.brut + item.brut,
            amort: acc.amort + item.amort,
            net: acc.net + (item.brut - item.amort),
        }),
        { brut: 0, amort: 0, net: 0 }
    );

    const tresorerie = bilanData.actif.tresorerie.reduce(
        (acc, item) => ({
            brut: acc.brut + item.brut,
            amort: acc.amort + item.amort,
            net: acc.net + (item.brut - item.amort),
        }),
        { brut: 0, amort: 0, net: 0 }
    );

    const totalActif = actifImmobilise.net + actifCirculant.net + tresorerie.net;

    const capitauxPropres = bilanData.passif.capitauxPropres.reduce(
        (acc, item) => acc + item.montant,
        0
    );

    const dettes = bilanData.passif.dettes.reduce(
        (acc, item) => acc + item.montant,
        0
    );

    const totalPassif = capitauxPropres + dettes;

    const formatNumber = (num: number) => num.toLocaleString("fr-FR");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bilan</h1>
                    <p className="text-muted-foreground">
                        Situation au {bilanData.date}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>
                    <Button variant="outline">
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-primary/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Actif</p>
                                <p className="text-xl font-bold">{formatNumber(totalActif)} XOF</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                                <TrendingDown className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Passif</p>
                                <p className="text-xl font-bold">{formatNumber(totalPassif)} XOF</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={totalActif === totalPassif
                    ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200/50"
                    : "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200/50"
                }>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Équilibre</p>
                        <p className={`text-xl font-bold ${totalActif === totalPassif ? "text-emerald-600" : "text-red-600"}`}>
                            {totalActif === totalPassif ? "✓ Équilibré" : `Écart: ${formatNumber(totalActif - totalPassif)} XOF`}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Balance Sheet Tables */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* ACTIF */}
                <Card>
                    <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
                        <CardTitle className="text-lg text-blue-700 dark:text-blue-300">ACTIF</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-muted-foreground">
                                    <th className="text-left py-2 font-medium">Poste</th>
                                    <th className="text-right py-2 font-medium">Brut</th>
                                    <th className="text-right py-2 font-medium">Amort.</th>
                                    <th className="text-right py-2 font-medium">Net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Immobilisé */}
                                <tr className="bg-muted/30 font-medium">
                                    <td className="py-2" colSpan={4}>Actif immobilisé</td>
                                </tr>
                                {bilanData.actif.immobilise.map((item, i) => (
                                    <tr key={i} className="border-b border-muted">
                                        <td className="py-2 pl-4">{item.label}</td>
                                        <td className="py-2 text-right">{formatNumber(item.brut)}</td>
                                        <td className="py-2 text-right text-red-500">({formatNumber(item.amort)})</td>
                                        <td className="py-2 text-right font-medium">{formatNumber(item.brut - item.amort)}</td>
                                    </tr>
                                ))}
                                <tr className="border-b bg-blue-50/50">
                                    <td className="py-2 font-semibold">Sous-total Actif immobilisé</td>
                                    <td className="py-2 text-right font-semibold">{formatNumber(actifImmobilise.brut)}</td>
                                    <td className="py-2 text-right font-semibold text-red-500">({formatNumber(actifImmobilise.amort)})</td>
                                    <td className="py-2 text-right font-semibold">{formatNumber(actifImmobilise.net)}</td>
                                </tr>

                                {/* Circulant */}
                                <tr className="bg-muted/30 font-medium">
                                    <td className="py-2" colSpan={4}>Actif circulant</td>
                                </tr>
                                {bilanData.actif.circulant.map((item, i) => (
                                    <tr key={i} className="border-b border-muted">
                                        <td className="py-2 pl-4">{item.label}</td>
                                        <td className="py-2 text-right">{formatNumber(item.brut)}</td>
                                        <td className="py-2 text-right">{item.amort > 0 ? `(${formatNumber(item.amort)})` : "-"}</td>
                                        <td className="py-2 text-right font-medium">{formatNumber(item.brut - item.amort)}</td>
                                    </tr>
                                ))}

                                {/* Trésorerie */}
                                <tr className="bg-muted/30 font-medium">
                                    <td className="py-2" colSpan={4}>Trésorerie</td>
                                </tr>
                                {bilanData.actif.tresorerie.map((item, i) => (
                                    <tr key={i} className="border-b border-muted">
                                        <td className="py-2 pl-4">{item.label}</td>
                                        <td className="py-2 text-right">{formatNumber(item.brut)}</td>
                                        <td className="py-2 text-right">-</td>
                                        <td className="py-2 text-right font-medium">{formatNumber(item.brut)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-blue-100 dark:bg-blue-900/30 font-bold text-blue-700 dark:text-blue-300">
                                    <td className="py-3" colSpan={3}>TOTAL ACTIF</td>
                                    <td className="py-3 text-right">{formatNumber(totalActif)} XOF</td>
                                </tr>
                            </tfoot>
                        </table>
                    </CardContent>
                </Card>

                {/* PASSIF */}
                <Card>
                    <CardHeader className="bg-violet-50 dark:bg-violet-950/20">
                        <CardTitle className="text-lg text-violet-700 dark:text-violet-300">PASSIF</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-muted-foreground">
                                    <th className="text-left py-2 font-medium">Poste</th>
                                    <th className="text-right py-2 font-medium">Montant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Capitaux propres */}
                                <tr className="bg-muted/30 font-medium">
                                    <td className="py-2" colSpan={2}>Capitaux propres</td>
                                </tr>
                                {bilanData.passif.capitauxPropres.map((item, i) => (
                                    <tr key={i} className="border-b border-muted">
                                        <td className="py-2 pl-4">{item.label}</td>
                                        <td className="py-2 text-right font-medium">{formatNumber(item.montant)}</td>
                                    </tr>
                                ))}
                                <tr className="border-b bg-violet-50/50">
                                    <td className="py-2 font-semibold">Sous-total Capitaux propres</td>
                                    <td className="py-2 text-right font-semibold">{formatNumber(capitauxPropres)}</td>
                                </tr>

                                {/* Dettes */}
                                <tr className="bg-muted/30 font-medium">
                                    <td className="py-2" colSpan={2}>Dettes</td>
                                </tr>
                                {bilanData.passif.dettes.map((item, i) => (
                                    <tr key={i} className="border-b border-muted">
                                        <td className="py-2 pl-4">{item.label}</td>
                                        <td className="py-2 text-right font-medium">{formatNumber(item.montant)}</td>
                                    </tr>
                                ))}
                                <tr className="border-b bg-red-50/50">
                                    <td className="py-2 font-semibold">Sous-total Dettes</td>
                                    <td className="py-2 text-right font-semibold">{formatNumber(dettes)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="bg-violet-100 dark:bg-violet-900/30 font-bold text-violet-700 dark:text-violet-300">
                                    <td className="py-3">TOTAL PASSIF</td>
                                    <td className="py-3 text-right">{formatNumber(totalPassif)} XOF</td>
                                </tr>
                            </tfoot>
                        </table>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <Link href="/dashboard/rapports">
                    <Button variant="outline">
                        ← Retour aux rapports
                    </Button>
                </Link>
                <Link href="/dashboard/rapports/resultat">
                    <Button variant="outline">
                        Compte de résultat <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
