"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Download,
    FileText,
    Building2,
    Users
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Label } from "@/components/ui/label";

export default function DeclarationsPage() {
    const { data: session } = useSession();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedPeriod, setSelectedPeriod] = React.useState("");
    const [periods, setPeriods] = React.useState<string[]>([]);

    React.useEffect(() => {
        // Fetch payroll runs periods when session is ready
        const fetchPeriods = async () => {
            if (!session?.user?.companyId) return;
            try {
                // We'll reuse the payroll runs API or create a simplified one for periods
                const res = await fetch(`/api/payroll/runs?companyId=${session.user.companyId}`);
                if (res.ok) {
                    const data = await res.json();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const availablePeriods = data.map((run: any) =>
                        new Date(run.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                    );
                    setPeriods(availablePeriods);
                    if (availablePeriods.length > 0) {
                        setSelectedPeriod(availablePeriods[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch periods", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPeriods();
    }, [session]);

    const handleDownload = async (type: 'CNSS' | 'IRPP') => {
        if (!selectedPeriod) return;

        try {
            const res = await fetch(`/api/payroll/export/${type.toLowerCase()}?companyId=${session?.user?.companyId}&period=${selectedPeriod}`);
            if (!res.ok) throw new Error("Erreur export");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `declaration-${type.toLowerCase()}-${selectedPeriod.replace(' ', '_')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            // Add toast notification here ideally
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Déclarations Sociales & Fiscales</h1>
                    <p className="text-muted-foreground">
                        Générez vos fichiers de déclaration CNSS et Impôts
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sélection de la période</CardTitle>
                    <CardDescription>Choisissez le mois pour générer les déclarations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-4 max-w-md">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="period">Période de paie</Label>
                            <select
                                id="period"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                            >
                                <option value="">Choisir une période...</option>
                                {periods.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* CNSS Card */}
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Users className="h-24 w-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            Déclaration CNSS
                        </CardTitle>
                        <CardDescription>
                            Sécurité Sociale (Caisse Nationale)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-2 text-sm">
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">Type de fichier:</span>
                                <span className="font-medium">CSV Standard</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">Contient:</span>
                                <span className="font-medium">Cotisations salariales & patronales</span>
                            </p>
                        </div>
                        <Button
                            className="w-full bg-blue-700 hover:bg-blue-800"
                            onClick={() => handleDownload('CNSS')}
                            disabled={!selectedPeriod}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger le fichier CNSS
                        </Button>
                    </CardContent>
                </Card>

                {/* IRPP Card - Placeholder for next step mostly */}
                <Card className="relative overflow-hidden opacity-90">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <FileText className="h-24 w-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-emerald-600" />
                            Déclaration IRPP
                        </CardTitle>
                        <CardDescription>
                            Impôt sur le Revenu
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-2 text-sm">
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">Type de fichier:</span>
                                <span className="font-medium">CSV / Excel</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">Obligation:</span>
                                <span className="font-medium">Mensuelle</span>
                            </p>
                        </div>
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            variant="default"
                            onClick={() => handleDownload('IRPP')}
                            disabled={!selectedPeriod}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger la déclaration IRPP
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
