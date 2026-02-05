"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus,
    Landmark,
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowUpDown,
    Upload,
    RefreshCw,
    MoreHorizontal,
    Loader2,
    Eye,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

type BankAccount = {
    id: string;
    name: string;
    bankName: string;
    accountNumber: string | null;
    currency: string;
    currentBalance: number;
    pendingReconciliation: number;
    lastSync: string;
    isActive: boolean;
};

const formSchema = z.object({
    name: z.string().min(1, "Le nom du compte est requis"),
    bankName: z.string().min(1, "Le nom de la banque est requis"),
    accountNumber: z.string().optional(),
    currency: z.string().default("XOF"),
    // Keep as string in form to avoid input/output mismatches
    initialBalance: z.string().default("0"),
});

type FormValues = z.infer<typeof formSchema>;

export default function BankAccountsPage() {
    const { data: session } = useSession();
    const toaster = useToast();
    const [accounts, setAccounts] = React.useState<BankAccount[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    const form = useForm({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            bankName: "",
            accountNumber: "",
            currency: "XOF",
            initialBalance: "0",
        },
    });

    const fetchAccounts = React.useCallback(async () => {
        if (!session?.user?.companyId) return;
        try {
            const response = await fetch(`/api/bank/accounts?companyId=${session.user.companyId}`);
            if (response.ok) {
                const data = await response.json();
                setAccounts(data);
            }
        } catch (error) {
            console.error(error);
            toaster.error("Impossible de charger les comptes");
        } finally {
            setIsLoading(false);
        }
    }, [session, toaster]);

    React.useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const onSubmit = async (values: FormValues) => {
        if (!session?.user?.companyId) return;
        try {
            const response = await fetch("/api/bank/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId: session.user.companyId,
                    ...values,
                    initialBalance: parseFloat(values.initialBalance) || 0,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erreur lors de la création");
            }

            toaster.success("Compte bancaire créé avec succès");
            setIsCreateOpen(false);
            form.reset();
            fetchAccounts();
        } catch (error) {
            console.error(error);
            toaster.error(error instanceof Error ? error.message : "Erreur inconnue");
        }
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const pendingReconciliation = accounts.reduce((sum, acc) => sum + acc.pendingReconciliation, 0);

    /* TODO: Intégrer les vraies transactions récentes via une autre API */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentTransactions: any[] = [];

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Comptes bancaires</h1>
                    <p className="text-muted-foreground">
                        Gérez vos comptes et vos opérations
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/banque/import">
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" />
                            Importer relevé
                        </Button>
                    </Link>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Nouveau compte
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nouveau compte bancaire</DialogTitle>
                                <DialogDescription>
                                    Ajoutez un nouveau compte bancaire ou une caisse.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nom du compte</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Compte courant principal" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="bankName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Banque</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: BOA, Ecobank, Caisse..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="currency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Devise</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Devise" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="XOF">XOF (CFA)</SelectItem>
                                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                                            <SelectItem value="USD">USD ($)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="accountNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Numéro de compte</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Optionnel" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="initialBalance"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Solde initial</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                                        <Button type="submit">Créer le compte</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-primary/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Wallet className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Solde total</p>
                                <p className="text-2xl font-bold">{totalBalance.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">XOF</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                                <RefreshCw className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">À rapprocher</p>
                                <p className="text-2xl font-bold">{pendingReconciliation} <span className="text-sm font-normal text-muted-foreground">opérations</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                                <Landmark className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Comptes actifs</p>
                                <p className="text-2xl font-bold">{accounts.filter(a => a.isActive).length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Comptes */}
            {accounts.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <Landmark className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium">Aucun compte bancaire</h3>
                    <p className="text-muted-foreground mb-4">Commencez par ajouter votre premier compte bancaire ou caisse.</p>
                    <Button onClick={() => setIsCreateOpen(true)}>Créer un compte</Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((account) => (
                        <Card key={account.id} className="group hover:shadow-lg hover:border-primary/50 transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                                            <Landmark className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{account.name}</h3>
                                            <p className="text-sm text-muted-foreground">{account.bankName}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Solde actuel</p>
                                        <p className="text-2xl font-bold">
                                            {account.currentBalance.toLocaleString("fr-FR")}
                                            <span className="text-sm font-normal text-muted-foreground ml-1">{account.currency}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {account.accountNumber ? `N° ${account.accountNumber}` : "Sans numéro"}
                                        </span>
                                        {account.pendingReconciliation > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                                {account.pendingReconciliation} à rapprocher
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        Dernière màj: {format(new Date(account.lastSync), "dd MMM yyyy HH:mm", { locale: fr })}
                                    </p>
                                </div>

                                <div className="mt-4 pt-4 border-t flex gap-2">
                                    <Link href={`/dashboard/banque/comptes/${account.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Eye className="mr-2 h-3.5 w-3.5" />
                                            Voir
                                        </Button>
                                    </Link>
                                    <Link href={`/dashboard/banque/rapprochement?accountId=${account.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                                            Rapprocher
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Transactions récentes (Placeholders for now until transactions API is ready) */}
            {recentTransactions.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Dernières opérations</CardTitle>
                        <Link href="/dashboard/banque/rapprochement">
                            <Button variant="outline" size="sm">
                                Voir tout
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${tx.type === 'credit' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                            {tx.type === 'credit' ? (
                                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4 text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{tx.label}</p>
                                            <p className="text-xs text-muted-foreground">{tx.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {tx.amount.toLocaleString("fr-FR")} XOF
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
