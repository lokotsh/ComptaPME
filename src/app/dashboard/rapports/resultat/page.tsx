"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Download,
    FileSpreadsheet,
    TrendingUp,
    TrendingDown,
    ArrowLeft,
} from "lucide-react";

import { useSession } from "next-auth/react";

export default function IncomeStatementPage() {
    const { data: session } = useSession();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = React.useState(true);
    const [compteResultatData, setCompteResultatData] = React.useState({
        periode: `Exercice ${new Date().getFullYear()}`,
        produits: {
            exploitation: [
                { label: "Ventes de marchandises", n: 0, n1: 0 },
                { label: "Prestations de services", n: 0, n1: 0 },
                { label: "Produits accessoires", n: 0, n1: 0 },
            ],
            financiers: [
                { label: "Intérêts perçus", n: 0, n1: 0 },
            ],
            exceptionnels: [
                { label: "Produits exceptionnels", n: 0, n1: 0 },
            ],
        },
        charges: {
            exploitation: [
                { label: "Achats de marchandises", n: 0, n1: 0 },
                { label: "Variation de stocks", n: 0, n1: 0 },
                { label: "Autres achats et charges externes", n: 0, n1: 0 },
                { label: "Impôts et taxes", n: 0, n1: 0 },
                { label: "Charges de personnel", n: 0, n1: 0 },
                { label: "Dotations aux amortissements", n: 0, n1: 0 },
            ],
            financieres: [
                { label: "Intérêts payés", n: 0, n1: 0 },
            ],
            exceptionnelles: [
                { label: "Charges exceptionnelles", n: 0, n1: 0 },
            ],
        },
    });

    React.useEffect(() => {
        const fetchData = async () => {
            if (!session?.user?.companyId) return;
            try {
                const res = await fetch(`/api/reports/income-statement?companyId=${session.user.companyId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCompteResultatData(data);
                }
            } catch (error) {
                console.error("Failed to fetch income statement", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [session]);
    // Calculs
    const totalProduitsExploitation = compteResultatData.produits.exploitation.reduce((acc, item) => acc + item.n, 0);
    const totalProduitsFinanciers = compteResultatData.produits.financiers.reduce((acc, item) => acc + item.n, 0);
    const totalProduitsExceptionnels = compteResultatData.produits.exceptionnels.reduce((acc, item) => acc + item.n, 0);
    const totalProduits = totalProduitsExploitation + totalProduitsFinanciers + totalProduitsExceptionnels;

    const totalChargesExploitation = compteResultatData.charges.exploitation.reduce((acc, item) => acc + item.n, 0);
    const totalChargesFinancieres = compteResultatData.charges.financieres.reduce((acc, item) => acc + item.n, 0);
    const totalChargesExceptionnelles = compteResultatData.charges.exceptionnelles.reduce((acc, item) => acc + item.n, 0);
    const totalCharges = totalChargesExploitation + totalChargesFinancieres + totalChargesExceptionnelles;

    const resultatExploitation = totalProduitsExploitation - totalChargesExploitation;
    // const resultatFinancier = totalProduitsFinanciers - totalChargesFinancieres;
    // const resultatExceptionnel = totalProduitsExceptionnels - totalChargesExceptionnelles;
    const resultatBrut = totalProduits - totalCharges;

    // Impôt sur les bénéfices (estimé à 30%)
    const impotBenefices = resultatBrut > 0 ? Math.round(resultatBrut * 0.30) : 0;
    const resultatNet = resultatBrut - impotBenefices;

    const formatNumber = (num: number) => {
        const formatted = Math.abs(num).toLocaleString("fr-FR");
        return num < 0 ? `(${formatted})` : formatted;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Compte de résultat</h1>
                    <p className="text-muted-foreground">
                        {compteResultatData.periode}
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
            <div className="grid gap-4 sm:grid-cols-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Produits</p>
                                <p className="text-xl font-bold text-emerald-600">{(totalProduits / 1000000).toFixed(1)}M XOF</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                                <TrendingDown className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Charges</p>
                                <p className="text-xl font-bold text-red-600">{(totalCharges / 1000000).toFixed(1)}M XOF</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Impôt sur bénéfices</p>
                        <p className="text-xl font-bold text-amber-600">{(impotBenefices / 1000000).toFixed(2)}M XOF</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-primary/20">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Résultat Net</p>
                        <p className={`text-xl font-bold ${resultatNet >= 0 ? "text-primary" : "text-red-600"}`}>
                            {(resultatNet / 1000000).toFixed(2)}M XOF
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Income Statement Table */}
            <Card>
                <CardContent className="pt-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-muted-foreground">
                                <th className="text-left py-2 font-medium">Poste</th>
                                <th className="text-right py-2 font-medium">Exercice N</th>
                                <th className="text-right py-2 font-medium">Exercice N-1</th>
                                <th className="text-right py-2 font-medium">Variation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* PRODUITS D'EXPLOITATION */}
                            <tr className="bg-emerald-50 dark:bg-emerald-950/20 font-semibold text-emerald-700 dark:text-emerald-300">
                                <td className="py-2" colSpan={4}>PRODUITS D&apos;EXPLOITATION</td>
                            </tr>
                            {compteResultatData.produits.exploitation.map((item, i) => (
                                <tr key={i} className="border-b border-muted">
                                    <td className="py-2 pl-4">{item.label}</td>
                                    <td className="py-2 text-right font-medium">{formatNumber(item.n)}</td>
                                    <td className="py-2 text-right text-muted-foreground">{formatNumber(item.n1)}</td>
                                    <td className={`py-2 text-right ${item.n >= item.n1 ? "text-emerald-600" : "text-red-600"}`}>
                                        {item.n >= item.n1 ? "+" : ""}{((item.n - item.n1) / item.n1 * 100).toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-emerald-100/50 font-semibold">
                                <td className="py-2">Total Produits d&apos;exploitation</td>
                                <td className="py-2 text-right">{formatNumber(totalProduitsExploitation)}</td>
                                <td className="py-2 text-right text-muted-foreground">
                                    {formatNumber(compteResultatData.produits.exploitation.reduce((a, b) => a + b.n1, 0))}
                                </td>
                                <td className="py-2 text-right"></td>
                            </tr>

                            {/* CHARGES D'EXPLOITATION */}
                            <tr className="bg-red-50 dark:bg-red-950/20 font-semibold text-red-700 dark:text-red-300">
                                <td className="py-2" colSpan={4}>CHARGES D&apos;EXPLOITATION</td>
                            </tr>
                            {compteResultatData.charges.exploitation.map((item, i) => (
                                <tr key={i} className="border-b border-muted">
                                    <td className="py-2 pl-4">{item.label}</td>
                                    <td className="py-2 text-right font-medium">{formatNumber(item.n)}</td>
                                    <td className="py-2 text-right text-muted-foreground">{formatNumber(item.n1)}</td>
                                    <td className="py-2 text-right"></td>
                                </tr>
                            ))}
                            <tr className="bg-red-100/50 font-semibold">
                                <td className="py-2">Total Charges d&apos;exploitation</td>
                                <td className="py-2 text-right">{formatNumber(totalChargesExploitation)}</td>
                                <td className="py-2 text-right text-muted-foreground">
                                    {formatNumber(compteResultatData.charges.exploitation.reduce((a, b) => a + b.n1, 0))}
                                </td>
                                <td className="py-2 text-right"></td>
                            </tr>

                            {/* RÉSULTAT D'EXPLOITATION */}
                            <tr className="bg-blue-100 dark:bg-blue-900/30 font-bold">
                                <td className="py-3">RÉSULTAT D&apos;EXPLOITATION</td>
                                <td className={`py-3 text-right ${resultatExploitation >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {formatNumber(resultatExploitation)}
                                </td>
                                <td className="py-3 text-right text-muted-foreground">-</td>
                                <td className="py-3 text-right"></td>
                            </tr>

                            {/* Produits et charges financiers */}
                            <tr className="bg-muted/30">
                                <td className="py-2">Produits financiers</td>
                                <td className="py-2 text-right">{formatNumber(totalProduitsFinanciers)}</td>
                                <td className="py-2 text-right text-muted-foreground">
                                    {formatNumber(compteResultatData.produits.financiers.reduce((a, b) => a + b.n1, 0))}
                                </td>
                                <td className="py-2 text-right"></td>
                            </tr>
                            <tr className="bg-muted/30">
                                <td className="py-2">Charges financières</td>
                                <td className="py-2 text-right">({formatNumber(totalChargesFinancieres)})</td>
                                <td className="py-2 text-right text-muted-foreground">
                                    ({formatNumber(compteResultatData.charges.financieres.reduce((a, b) => a + b.n1, 0))})
                                </td>
                                <td className="py-2 text-right"></td>
                            </tr>

                            {/* RÉSULTAT NET */}
                            <tr className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 font-bold text-lg">
                                <td className="py-4">RÉSULTAT NET</td>
                                <td className={`py-4 text-right ${resultatNet >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {formatNumber(resultatNet)} XOF
                                </td>
                                <td className="py-4 text-right text-muted-foreground">-</td>
                                <td className="py-4 text-right"></td>
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
                <Link href="/dashboard/rapports/bilan">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Bilan
                    </Button>
                </Link>
                <Link href="/dashboard/rapports">
                    <Button variant="outline">
                        Retour aux rapports
                    </Button>
                </Link>
            </div>
        </div>
    );
}
