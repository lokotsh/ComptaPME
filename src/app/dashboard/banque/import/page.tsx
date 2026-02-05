"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Upload,
    FileSpreadsheet,
    ArrowLeft,
    Check,
    AlertTriangle,
    Landmark,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface ParsedTransaction {
    date: string;
    label: string;
    amount: number;
    type: "credit" | "debit";
    reference: string;
}

interface BankAccountData {
    id: string;
    name: string;
    bankName: string;
}

export default function ImportBankStatementPage() {
    useRouter(); // Kept for potential future use
    const { data: session } = useSession();
    const toaster = useToast();

    const [file, setFile] = React.useState<File | null>(null);
    const [selectedAccount, setSelectedAccount] = React.useState("");
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [parsedTransactions, setParsedTransactions] = React.useState<ParsedTransaction[]>([]);
    const [importComplete, setImportComplete] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [bankAccounts, setBankAccounts] = React.useState<{ id: string; name: string; bank: string }[]>([]);

    React.useEffect(() => {
        const fetchAccounts = async () => {
            if (!session?.user?.companyId) return;
            try {
                const res = await fetch(`/api/bank/accounts?companyId=${session.user.companyId}`);
                if (res.ok) {
                    const data = await res.json();
                    setBankAccounts(data.map((a: BankAccountData) => ({ id: a.id, name: a.name, bank: a.bankName })));
                }
            } catch (err) {
                console.error("Erreur chargement comptes", err);
            }
        };
        fetchAccounts();
    }, [session]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith(".csv") && !selectedFile.name.endsWith(".ofx")) {
                setError("Format non supporté. Utilisez un fichier CSV ou OFX.");
                return;
            }
            setFile(selectedFile);
            setError(null);
            parseFile(selectedFile);
        }
    };

    const parseFile = async (file: File) => {
        setIsProcessing(true);

        try {
            const text = await file.text();
            const lines = text.split("\n").filter((line) => line.trim());

            // Skip header line
            const dataLines = lines.slice(1);

            const transactions: ParsedTransaction[] = dataLines.map((line, index) => {
                const parts = line.split(";").map((p) => p.trim().replace(/"/g, ""));
                // Expected format: Date;Libellé;Débit;Crédit;Référence
                const [date, label, debit, credit, reference] = parts;

                const debitAmount = parseFloat(debit?.replace(/\s/g, "").replace(",", ".")) || 0;
                const creditAmount = parseFloat(credit?.replace(/\s/g, "").replace(",", ".")) || 0;

                return {
                    date: date || "",
                    label: label || `Transaction ${index + 1}`,
                    amount: creditAmount > 0 ? creditAmount : -debitAmount,
                    type: creditAmount > 0 ? "credit" as const : "debit" as const,
                    reference: reference || "",
                };
            }).filter((t) => t.date && (t.amount !== 0));

            setParsedTransactions(transactions);
            if (transactions.length === 0) {
                setError("Aucune transaction trouvée. Vérifiez le format (point-virgule séparateur).");
            }
        } catch {
            setError("Erreur lors de la lecture du fichier");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        if (!selectedAccount || parsedTransactions.length === 0) return;

        setIsProcessing(true);

        try {
            const res = await fetch("/api/bank/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bankAccountId: selectedAccount,
                    transactions: parsedTransactions,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erreur lors de l'import");
            }

            setImportComplete(true);
            toaster.success("Transacctions importées avec succès");
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Erreur inconnue");
            toaster.error("Échec de l'import");
        } finally {
            setIsProcessing(false);
        }
    };

    const stats = {
        total: parsedTransactions.length,
        credits: parsedTransactions.filter((t) => t.type === "credit").length,
        debits: parsedTransactions.filter((t) => t.type === "debit").length,
        totalCredits: parsedTransactions.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.amount, 0),
        totalDebits: Math.abs(parsedTransactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.amount, 0)),
    };

    if (importComplete) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <CardContent className="pt-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Check className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Import réussi !</h2>
                        <p className="text-muted-foreground mb-6">
                            {parsedTransactions.length} opérations ont été importées avec succès sur le compte.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link href={`/dashboard/banque/rapprochement?accountId=${selectedAccount}`}>
                                <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                                    Rapprocher les opérations
                                </Button>
                            </Link>
                            <Link href="/dashboard/banque/comptes">
                                <Button variant="outline">
                                    Retour aux comptes
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/banque/comptes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Import de relevé bancaire</h1>
                    <p className="text-muted-foreground">
                        Importez vos opérations depuis un fichier CSV ou OFX
                    </p>
                </div>
            </div>

            {/* Step 1: Select Account */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">1</span>
                        Sélectionnez le compte
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {bankAccounts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun compte bancaire trouvé. Veuillez d&apos;abord en créer un.</p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {bankAccounts.map((account) => (
                                <div
                                    key={account.id}
                                    onClick={() => setSelectedAccount(account.id)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedAccount === account.id
                                        ? "border-primary bg-primary/5"
                                        : "border-muted hover:border-muted-foreground/50"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                            <Landmark className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{account.name}</p>
                                            <p className="text-sm text-muted-foreground">{account.bank}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Step 2: Upload File */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">2</span>
                        Chargez votre fichier
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${file ? "border-emerald-300 bg-emerald-50/50" : "border-muted-foreground/25 hover:border-primary/50"
                                }`}
                            onClick={() => document.getElementById("file-input")?.click()}
                        >
                            <input
                                id="file-input"
                                type="file"
                                accept=".csv,.ofx"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {file ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                                    <div className="text-left">
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {(file.size / 1024).toFixed(1)} Ko
                                        </p>
                                    </div>
                                    <Check className="h-5 w-5 text-emerald-600" />
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                    <p className="font-medium">Glissez un fichier ici ou cliquez pour parcourir</p>
                                    <p className="text-sm text-muted-foreground">Formats acceptés : CSV, OFX</p>
                                </>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-1">Format CSV attendu (séparateur point-virgule) :</p>
                            <code className="block p-2 rounded bg-muted text-xs">
                                Date;Libellé;Débit;Crédit;Référence
                            </code>
                            <p className="mt-1 text-xs text-muted-foreground italic">Ex: 18/01/2026;Virement Client;0;150000;REF123</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step 3: Preview & Confirm */}
            {parsedTransactions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">3</span>
                            Aperçu des opérations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Stats */}
                        <div className="grid gap-3 sm:grid-cols-4 mb-6">
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Total opérations</p>
                                <p className="text-xl font-bold">{stats.total}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                <p className="text-sm text-muted-foreground">Crédits ({stats.credits})</p>
                                <p className="text-xl font-bold text-emerald-600">+{stats.totalCredits.toLocaleString("fr-FR")} XOF</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                                <p className="text-sm text-muted-foreground">Débits ({stats.debits})</p>
                                <p className="text-xl font-bold text-red-600">-{stats.totalDebits.toLocaleString("fr-FR")} XOF</p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <p className="text-sm text-muted-foreground">Solde net</p>
                                <p className={`text-xl font-bold ${stats.totalCredits - stats.totalDebits >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {(stats.totalCredits - stats.totalDebits).toLocaleString("fr-FR")} XOF
                                </p>
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 sticky top-0">
                                    <tr>
                                        <th className="text-left py-2 px-3 font-medium">Date</th>
                                        <th className="text-left py-2 px-3 font-medium">Libellé</th>
                                        <th className="text-right py-2 px-3 font-medium">Montant</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedTransactions.slice(0, 10).map((tx, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="py-2 px-3">{tx.date}</td>
                                            <td className="py-2 px-3">{tx.label}</td>
                                            <td className={`py-2 px-3 text-right font-medium ${tx.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                                                {tx.type === "credit" ? "+" : ""}{tx.amount.toLocaleString("fr-FR")} XOF
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {parsedTransactions.length > 10 && (
                                <div className="p-2 text-center text-sm text-muted-foreground bg-muted/50">
                                    ... et {parsedTransactions.length - 10} autres opérations
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Link href="/dashboard/banque/comptes">
                    <Button variant="outline">Annuler</Button>
                </Link>
                <Button
                    onClick={handleImport}
                    disabled={!selectedAccount || parsedTransactions.length === 0 || isProcessing}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700"
                >
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isProcessing ? "Import en cours..." : `Importer ${parsedTransactions.length} opérations`}
                </Button>
            </div>
        </div>
    );
}
