"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Send,
    Calculator,
    Loader2,
} from "lucide-react";

interface InvoiceLine {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    tvaRate: number;
}

interface Client {
    id: string;
    name: string;
    ifu: string;
}

export default function NewQuotePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const toaster = useToast();

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [clients, setClients] = React.useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = React.useState("");
    const [issueDate, setIssueDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = React.useState(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [notes, setNotes] = React.useState(
        "Ce devis est valable 30 jours à compter de sa date d'émission. Pour toute commande, merci de retourner ce devis signé avec la mention 'Bon pour accord'."
    );

    const [lines, setLines] = React.useState<InvoiceLine[]>([
        { id: "1", description: "", quantity: 1, unitPrice: 0, tvaRate: 18 },
    ]);

    // Charger les clients
    React.useEffect(() => {
        const fetchClients = async () => {
            if (!session?.user?.companyId) return;
            try {
                const res = await fetch(`/api/clients?companyId=${session.user.companyId}`);
                if (res.ok) {
                    const data = await res.json();
                    setClients(data.clients || data || []);
                }
            } catch {
                console.error("Erreur chargement clients");
            }
        };
        fetchClients();
    }, [session]);

    const addLine = () => {
        setLines([
            ...lines,
            {
                id: Date.now().toString(),
                description: "",
                quantity: 1,
                unitPrice: 0,
                tvaRate: 18,
            },
        ]);
    };

    const removeLine = (id: string) => {
        if (lines.length > 1) {
            setLines(lines.filter((line) => line.id !== id));
        }
    };

    const updateLine = (id: string, field: keyof InvoiceLine, value: string | number) => {
        setLines(
            lines.map((line) =>
                line.id === id ? { ...line, [field]: value } : line
            )
        );
    };

    const calculateLineTotal = (line: InvoiceLine) => {
        const ht = line.quantity * line.unitPrice;
        const tva = ht * (line.tvaRate / 100);
        return { ht, tva, ttc: ht + tva };
    };

    const totals = lines.reduce(
        (acc, line) => {
            const lineTotal = calculateLineTotal(line);
            return {
                ht: acc.ht + lineTotal.ht,
                tva: acc.tva + lineTotal.tva,
                ttc: acc.ttc + lineTotal.ttc,
            };
        },
        { ht: 0, tva: 0, ttc: 0 }
    );

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const handleSubmit = async (asDraft: boolean = false) => {
        if (!session?.user?.companyId) {
            toaster.error("Session expirée, veuillez vous reconnecter");
            return;
        }

        if (!selectedClientId && !asDraft) {
            toaster.error("Veuillez sélectionner un client");
            return;
        }

        const validLines = lines.filter(l => l.description && l.unitPrice > 0);
        if (validLines.length === 0 && !asDraft) {
            toaster.error("Ajoutez au moins une ligne de devis valide");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                companyId: session.user.companyId,
                createdById: session.user.id,
                clientId: selectedClientId,
                issueDate: issueDate,
                dueDate: dueDate,
                notes: notes,
                type: "QUOTE", // IMPORTANT : Type Devis
                status: asDraft ? "DRAFT" : "SENT", // SENT = Envoyé/Validé pour un devis
                lines: validLines.map(line => ({
                    description: line.description,
                    quantity: line.quantity,
                    unitPriceHT: line.unitPrice,
                    tvaRate: line.tvaRate,
                })),
            };

            const res = await fetch(`/api/invoices`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erreur lors de la création");
            }

            const invoice = await res.json();
            toaster.success(asDraft ? "Brouillon enregistré" : "Devis créé avec succès !");
            router.push(`/dashboard/ventes/devis/${invoice.id}`);

        } catch (error) {
            console.error(error);
            toaster.error(error instanceof Error ? error.message : "Erreur serveur");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/ventes/devis">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Nouveau devis</h1>
                        <p className="text-muted-foreground">Créez une nouveau devis client</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleSubmit(true)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Enregistrer brouillon
                    </Button>
                    <Button
                        className="bg-gradient-to-r from-blue-600 to-indigo-700"
                        onClick={() => handleSubmit(false)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        Créer le devis
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Client Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Informations client</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="client">Client</Label>
                                    <select
                                        id="client"
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="">Sélectionner un client...</option>
                                        {clients.map((client) => (
                                            <option key={client.id} value={client.id}>
                                                {client.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>IFU Client</Label>
                                    <Input
                                        value={selectedClient?.ifu || ""}
                                        disabled
                                        className="bg-muted"
                                        placeholder="Sélectionnez un client"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoice Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Détails du devis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="issueDate">Date d&apos;émission</Label>
                                    <Input
                                        id="issueDate"
                                        type="date"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Date de validité</Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoice Lines */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Lignes du devis</CardTitle>
                            <Button variant="outline" size="sm" onClick={addLine}>
                                <Plus className="mr-2 h-4 w-4" />
                                Ajouter une ligne
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {lines.map((line) => (
                                    <div key={line.id} className="grid gap-4 sm:grid-cols-12 items-end p-4 rounded-lg bg-muted/50">
                                        <div className="sm:col-span-4 space-y-2">
                                            <Label>Description</Label>
                                            <Input
                                                placeholder="Description du produit/service"
                                                value={line.description}
                                                onChange={(e) => updateLine(line.id, "description", e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-2 space-y-2">
                                            <Label>Quantité</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={line.quantity}
                                                onChange={(e) => updateLine(line.id, "quantity", parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="sm:col-span-2 space-y-2">
                                            <Label>Prix HT</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={line.unitPrice}
                                                onChange={(e) => updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="sm:col-span-2 space-y-2">
                                            <Label>TVA %</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={line.tvaRate}
                                                onChange={(e) => updateLine(line.id, "tvaRate", parseFloat(e.target.value))}
                                            >
                                                <option value="0">0%</option>
                                                <option value="5">5%</option>
                                                <option value="18">18%</option>
                                            </select>
                                        </div>
                                        <div className="sm:col-span-1 space-y-2">
                                            <Label>Total TTC</Label>
                                            <div className="h-10 flex items-center font-semibold">
                                                {calculateLineTotal(line).ttc.toLocaleString("fr-FR")}
                                            </div>
                                        </div>
                                        <div className="sm:col-span-1 flex items-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => removeLine(line.id)}
                                                disabled={lines.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Notes &amp; conditions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Conditions de validité, notes additionnelles..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Récapitulatif
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Sous-total HT</span>
                                    <span className="font-medium">{totals.ht.toLocaleString("fr-FR")} XOF</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">TVA</span>
                                    <span className="font-medium">{totals.tva.toLocaleString("fr-FR")} XOF</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between">
                                    <span className="font-semibold">Total TTC</span>
                                    <span className="font-bold text-lg">{totals.ttc.toLocaleString("fr-FR")} XOF</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t space-y-3">
                                <Button
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700"
                                    onClick={() => handleSubmit(false)}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Créer le devis
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleSubmit(true)}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Enregistrer brouillon
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
