"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    Globe,
    CreditCard,
    FileText,
    Save,
    Upload,
} from "lucide-react";

export default function CompanySettingsPage() {
    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSaving(false);
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Paramètres de l&apos;entreprise</h1>
                    <p className="text-muted-foreground">
                        Configurez les informations de votre société
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Enregistrement..." : "Enregistrer"}
                </Button>
            </div>

            {/* Company Identity */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Identité de l&apos;entreprise
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-6">
                        {/* Logo Upload */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                                <Upload className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <Button variant="outline" size="sm">
                                Changer le logo
                            </Button>
                        </div>

                        {/* Company Info */}
                        <div className="flex-1 grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="companyName" required>
                                    Raison sociale
                                </Label>
                                <Input id="companyName" defaultValue="Ma Société SARL" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="legalForm">Forme juridique</Label>
                                <select
                                    id="legalForm"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    defaultValue="SARL"
                                >
                                    <option value="EI">Entreprise Individuelle</option>
                                    <option value="SARL">SARL</option>
                                    <option value="SA">SA</option>
                                    <option value="SAS">SAS</option>
                                    <option value="SNC">SNC</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="capital">Capital social (XOF)</Label>
                                <Input id="capital" type="number" defaultValue="10000000" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Coordonnées
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="address">
                                Adresse
                            </Label>
                            <Input id="address" defaultValue="Quartier Akpakpa, Rue 123" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">Ville</Label>
                            <Input id="city" defaultValue="Cotonou" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Pays</Label>
                            <Input id="country" defaultValue="Bénin" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">
                                <Phone className="inline h-4 w-4 mr-1" />
                                Téléphone
                            </Label>
                            <Input id="phone" defaultValue="+229 21 31 45 67" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                <Mail className="inline h-4 w-4 mr-1" />
                                Email
                            </Label>
                            <Input id="email" type="email" defaultValue="contact@masociete.bj" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="website">
                                <Globe className="inline h-4 w-4 mr-1" />
                                Site web
                            </Label>
                            <Input id="website" defaultValue="www.masociete.bj" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Fiscal Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Informations fiscales
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="ifu" required>
                                IFU (Identifiant Fiscal Unique)
                            </Label>
                            <Input id="ifu" defaultValue="3201501234567" />
                            <p className="text-xs text-muted-foreground">
                                13 chiffres commençant par 320
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rccm">RCCM</Label>
                            <Input id="rccm" defaultValue="RB/COT/2020/B/12345" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tvaRegime">Régime TVA</Label>
                            <select
                                id="tvaRegime"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue="real"
                            >
                                <option value="franchise">Franchise de TVA</option>
                                <option value="real">Régime réel normal</option>
                                <option value="simplified">Régime réel simplifié</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tvaRate">Taux TVA par défaut (%)</Label>
                            <Input id="tvaRate" type="number" defaultValue="18" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invoice Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Paramètres de facturation
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="invoicePrefix">Préfixe factures</Label>
                            <Input id="invoicePrefix" defaultValue="FAC" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quotePrefix">Préfixe devis</Label>
                            <Input id="quotePrefix" defaultValue="DEV" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paymentTerms">Délai de paiement par défaut (jours)</Label>
                            <Input id="paymentTerms" type="number" defaultValue="30" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Devise</Label>
                            <select
                                id="currency"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue="XOF"
                            >
                                <option value="XOF">XOF - Franc CFA (BCEAO)</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="USD">USD - Dollar US</option>
                            </select>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="invoiceFooter">Mentions légales sur factures</Label>
                            <textarea
                                id="invoiceFooter"
                                className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue="En cas de retard de paiement, une indemnité forfaitaire de 40 € sera due. TVA non applicable, art. 293B du CGI."
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Fiscal Year */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Exercice fiscal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fiscalYearStart">Début de l&apos;exercice</Label>
                            <select
                                id="fiscalYearStart"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue="1"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(2020, i, 1).toLocaleDateString("fr-FR", { month: "long" })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currentFiscalYear">Exercice en cours</Label>
                            <Input id="currentFiscalYear" defaultValue="2026" disabled className="bg-muted" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
            </div>
        </div>
    );
}
