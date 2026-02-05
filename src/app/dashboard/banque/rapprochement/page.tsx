"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Search,
    Check,
    Link as LinkIcon,
    ArrowLeftRight,
    AlertTriangle,
    CheckCircle2,
    Upload,
    Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Transaction = {
    id: string;
    date: string;
    label: string;
    amount: number;
    type: "credit" | "debit";
    reconciled: boolean;
    matchedInvoiceId?: string;
    matchedType?: "client" | "supplier";
};

type Account = {
    id: string;
    name: string;
    bankName: string;
    currentBalance: number;
    currency: string;
};

export default function ReconciliationPage() {
    const { data: session } = useSession();
    const toaster = useToast();

    const [accounts, setAccounts] = React.useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = React.useState<string>("");

    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const [selectedTxId, setSelectedTxId] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    // Initialisation
    React.useEffect(() => {
        if (session?.user?.companyId) {
            fetchAccounts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    // Charger les transactions quand le compte change
    React.useEffect(() => {
        if (selectedAccount && session?.user?.companyId) {
            fetchTransactions(selectedAccount);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAccount, session]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`/api/bank/accounts?companyId=${session?.user?.companyId}`);
            if (res.ok) {
                const data = await res.json();
                setAccounts(data);
                if (data.length > 0 && !selectedAccount) {
                    setSelectedAccount(data[0].id);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTransactions = async (accountId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/bank/transactions?companyId=${session?.user?.companyId}&bankAccountId=${accountId}&limit=100`);
            if (res.ok) {
                const data: Transaction[] = await res.json();
                // Filter only unreconciled or recently reconciled? For now show all but prioritize unreconciled
                setTransactions(data);
            }
        } catch {
            toaster.error("Erreur chargement transactions");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReconcile = async (tx: Transaction, invoiceId: string) => {
        if (!tx.matchedType) return; // Sécurité

        try {
            const res = await fetch("/api/bank/transactions/reconcile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transactionId: tx.id,
                    invoiceId: invoiceId,
                    invoiceType: tx.matchedType,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erreur rapprochement");
            }

            toaster.success("Rapprochement validé");
            // Mettre à jour localement
            setTransactions(prev => prev.map(t =>
                t.id === tx.id ? { ...t, reconciled: true } : t
            ));

            // Si c'était la sélection courante, on désélectionne ou on passe au suivant
            if (selectedTxId === tx.id) {
                const next = transactions.find(t => !t.reconciled && t.id !== tx.id);
                setSelectedTxId(next ? next.id : null);
            }

        } catch (error) {
            console.error(error);
            toaster.error(error instanceof Error ? error.message : "Erreur");
        }
    };

    const activeTx = transactions.find(t => t.id === selectedTxId);

    // Stats
    const pendingCount = transactions.filter(t => !t.reconciled).length;
    const matchedCount = transactions.filter(t => t.reconciled).length;
    const pendingAmount = transactions.filter(t => !t.reconciled).reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Rapprochement bancaire</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Sélectionner un compte" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.bankName})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Importer relevé
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">À rapprocher</p>
                                <p className="text-xl font-bold">{pendingCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Rapprochées</p>
                                <p className="text-xl font-bold">{matchedCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Solde mouvements</p>
                                <p className={`text-xl font-bold ${pendingAmount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {pendingAmount > 0 ? '+' : ''}{pendingAmount.toLocaleString()} XOF
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Split View */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* List */}
                <Card className="h-[600px] flex flex-col">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg">Opérations bancaires</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <p>Aucune transaction trouvée</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {transactions.map(tx => (
                                    <div
                                        key={tx.id}
                                        onClick={() => !tx.reconciled && setSelectedTxId(tx.id)}
                                        className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${selectedTxId === tx.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''} ${tx.reconciled ? 'opacity-60 bg-muted/20' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-sm line-clamp-1 py-1" title={tx.label}>{tx.label}</span>
                                            <span className={`font-bold whitespace-nowrap ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                                            <span>{format(new Date(tx.date), "dd/MM/yyyy")}</span>
                                            {tx.reconciled ? (
                                                <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                    <Check className="h-3 w-3 mr-1" /> Rapproché
                                                </span>
                                            ) : tx.matchedInvoiceId ? (
                                                <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                    <LinkIcon className="h-3 w-3 mr-1" /> Suggéré
                                                </span>
                                            ) : (
                                                <span>À traiter</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Detail / Match Area */}
                <Card className="h-[600px] flex flex-col bg-muted/30">
                    <CardHeader className="pb-3 border-b bg-card">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ArrowLeftRight className="h-5 w-5" />
                            Rapprochement
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-6 flex flex-col justify-center">
                        {!activeTx ? (
                            <div className="text-center text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Sélectionnez une opération à gauche<br />pour commencer le rapprochement</p>
                            </div>
                        ) : activeTx.reconciled ? (
                            <div className="text-center">
                                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="h-8 w-8 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-emerald-800 mb-2">Opération déjà rapprochée</h3>
                                <p className="text-muted-foreground">Cette ligne a été validée et comptabilisée.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 w-full max-w-md mx-auto">
                                {/* Selected Transaction Info */}
                                <div className="bg-card border rounded-lg p-4 shadow-sm">
                                    <p className="text-xs text-muted-foreground mb-1">Transaction sélectionnée</p>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h3 className="font-bold text-lg">{activeTx.label}</h3>
                                        <span className={`font-mono font-bold ${activeTx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {activeTx.amount.toLocaleString()} XOF
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{format(new Date(activeTx.date), "dd MMMM yyyy")}</p>
                                </div>

                                {/* Suggestion Logic */}
                                {activeTx.matchedInvoiceId ? (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                                            <LinkIcon className="h-4 w-4" />
                                            Suggestion automatique trouvée
                                        </div>
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-amber-900">
                                                    Facture {activeTx.matchedType === 'client' ? 'Client' : 'Fournisseur'}
                                                </span>
                                                <span className="bg-white px-2 py-1 rounded text-xs border font-mono">
                                                    #{activeTx.matchedInvoiceId.split('-')[0]}...
                                                </span>
                                            </div>
                                            <p className="text-sm text-amber-800 mb-4">
                                                Montant correspondant et/ou référence trouvée.
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                                    onClick={() => activeTx.matchedInvoiceId && handleReconcile(activeTx, activeTx.matchedInvoiceId)}
                                                >
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Valider ce rapprochement
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Rechercher facture (N°, Client...)"
                                                className="pl-10"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                                            Aucune suggestion automatique.<br />
                                            Utilisez la recherche pour lier manuellement (Bientôt disponible).

                                            {/* TODO: Implémenter la liste de recherche manuelle ici */}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
