"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
import { AlertCircle, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";

export default function FiscalSettingsPage() {
    const { data: session } = useSession();
    const { success, error: errorToast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    // State
    const [taxSystem, setTaxSystem] = React.useState("REEL");
    const [tvaEnabled, setTvaEnabled] = React.useState(true);
    const [cnssEmployerRate, setCnssEmployerRate] = React.useState("15.4");
    const [cnssEmployeeRate, setCnssEmployeeRate] = React.useState("3.6");

    React.useEffect(() => {
        const fetchSettings = async () => {
            if (!session?.user?.companyId) return;
            try {
                const res = await fetch(`/api/settings/fiscal?companyId=${session.user.companyId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        setTaxSystem(data.taxSystem || "REEL");
                        setTvaEnabled(data.tvaEnabled);
                        setCnssEmployerRate(data.cnssEmployerRate?.toString() || "15.4");
                        setCnssEmployeeRate(data.cnssEmployeeRate?.toString() || "3.6");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [session]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/settings/fiscal?companyId=${session?.user?.companyId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    taxSystem,
                    tvaEnabled,
                    cnssEmployerRate: parseFloat(cnssEmployerRate),
                    cnssEmployeeRate: parseFloat(cnssEmployeeRate)
                })
            });

            if (res.ok) {
                success("Paramètres sauvegardés");
            } else {
                errorToast("Erreur lors de la sauvegarde");
            }
        } catch (error) {
            console.error("Save error", error);
            errorToast("Erreur serveur");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTaxSystemChange = (value: string) => {
        setTaxSystem(value);
        if (value === "TPS") {
            setTvaEnabled(false);
        } else {
            setTvaEnabled(true);
        }
    };

    if (isLoading) {
        return <div className="p-8">Chargement...</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Paramètres Fiscaux (Bénin)</h1>
                <p className="text-muted-foreground">
                    Configurez le régime fiscal de votre entreprise pour une conformité optimale.
                </p>
            </div>

            <Card className="border-l-4 border-l-primary">
                <CardHeader>
                    <CardTitle>Régime d&apos;Imposition</CardTitle>
                    <CardDescription>
                        Choisissez le régime correspondant à votre statut juridique et chiffre d&apos;affaires.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Régime Fiscal</Label>
                        <Select value={taxSystem} onValueChange={handleTaxSystemChange}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="REEL">Régime du Réel (Normal)</SelectItem>
                                <SelectItem value="TPS">Taxe Professionnelle Synthétique (TPS)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground mt-1">
                            {taxSystem === "REEL"
                                ? "Pour les entreprises avec CA > 50M FCFA ou SA/SARL. Inclut TVA et IS/IBA."
                                : "Pour les entreprises individuelles avec CA ≤ 50M FCFA. Impôt synthétique libératoire."}
                        </p>
                    </div>

                    {taxSystem === "TPS" && (
                        <Alert className="bg-amber-50 border-amber-200">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-800">Mode TPS Activé</AlertTitle>
                            <AlertDescription className="text-amber-700">
                                La collecte de la TVA sera désactivée sur vos factures. Le calcul des impôts se basera sur le taux forfaitaire ou le barème TPS.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Assujettissement à la TVA</Label>
                            <p className="text-sm text-muted-foreground">
                                Activez si vous devez collecter et reverser la TVA (18%).
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={tvaEnabled}
                                onChange={(e) => {
                                    if (taxSystem !== "TPS") setTvaEnabled(e.target.checked);
                                }}
                                disabled={taxSystem === "TPS"}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Paramètres Paie & Social (CNSS)</CardTitle>
                    <CardDescription>
                        Taux de cotisations en vigueur au Bénin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Taux Part Patronale (%)</Label>
                            <input
                                type="number"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={cnssEmployerRate}
                                onChange={(e) => setCnssEmployerRate(e.target.value)}
                                step="0.1"
                            />
                            <p className="text-xs text-muted-foreground">Standard: 15.4% (Prestations familiales 9% + AT/MP 4% + Retraite 6.4% employer)</p>
                            <p className="text-xs text-muted-foreground">
                                Officiel Bénin: Allocation Familiale (9%), AT (1-4%), Pension (6.4% employeur).
                                Total standard souvent ~15-16%.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Taux Part Salariale (%)</Label>
                            <input
                                type="number"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={cnssEmployeeRate}
                                onChange={(e) => setCnssEmployeeRate(e.target.value)}
                                step="0.1"
                            />
                            <p className="text-xs text-muted-foreground">Standard: 3.6% (Retraite)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Sauvegarde..." : "Enregistrer les modifications"}
                </Button>
            </div>
        </div>
    );
}
