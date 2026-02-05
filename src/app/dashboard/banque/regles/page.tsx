"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Rule {
    id: string;
    name: string;
    labelContains?: string;
    amountMin?: number;
    amountMax?: number;
    assignAccountId?: string;
    priority: number;
}

interface Account {
    id: string;
    code: string;
    label: string;
}

export default function BankRulesPage() {
    const { data: session } = useSession();
    const { success, error: errorToast } = useToast();
    const [rules, setRules] = React.useState<Rule[]>([]);
    const [accounts, setAccounts] = React.useState<Account[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // Form state
    const [newRule, setNewRule] = React.useState({
        name: "",
        labelContains: "",
        assignAccountId: "",
        amountMin: "",
        amountMax: ""
    });

    React.useEffect(() => {
        if (session?.user?.companyId) {
            getData();
        }
    }, [session]);

    const getData = async () => {
        try {
            const [rulesRes, accountsRes] = await Promise.all([
                fetch("/api/bank/rules"),
                fetch("/api/accounting/accounts")
            ]);

            if (rulesRes.ok) setRules(await rulesRes.json());
            if (accountsRes.ok) setAccounts(await accountsRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newRule.name) return;

        try {
            const res = await fetch("/api/bank/rules", {
                method: "POST",
                body: JSON.stringify({
                    ...newRule,
                    amountMin: newRule.amountMin ? parseFloat(newRule.amountMin) : undefined,
                    amountMax: newRule.amountMax ? parseFloat(newRule.amountMax) : undefined,
                })
            });

            if (res.ok) {
                success("Règle créée");
                setNewRule({ name: "", labelContains: "", assignAccountId: "", amountMin: "", amountMax: "" });
                getData();
            } else {
                errorToast("Erreur lors de la création");
            }
        } catch {
            errorToast("Erreur serveur");
        }
    };

    if (isLoading) return <div className="p-8">Chargement...</div>;

    const getAccountLabel = (id?: string) => {
        if (!id) return "-";
        const acc = accounts.find(a => a.id === id);
        return acc ? `${acc.code} - ${acc.label}` : id;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Règles de rapprochement</h1>
                    <p className="text-muted-foreground">Automatisez l&apos;affectation des transactions bancaires.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Formulaire Nouvelle Règle */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Nouvelle règle</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nom de la règle</label>
                            <Input
                                placeholder="Ex: Factures EDF"
                                value={newRule.name}
                                onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Si le libellé contient</label>
                            <Input
                                placeholder="Ex: SBEE"
                                value={newRule.labelContains}
                                onChange={e => setNewRule({ ...newRule, labelContains: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Montant Min</label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={newRule.amountMin}
                                    onChange={e => setNewRule({ ...newRule, amountMin: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Montant Max</label>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={newRule.amountMax}
                                    onChange={e => setNewRule({ ...newRule, amountMax: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Affecter au compte</label>
                            <Select
                                value={newRule.assignAccountId}
                                onValueChange={v => setNewRule({ ...newRule, assignAccountId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un compte..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.code} - {acc.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full" onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Créer la règle
                        </Button>
                    </CardContent>
                </Card>

                {/* Liste des Règles */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Règles actives</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nom</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Conditions</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {rules.length === 0 ? (
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <td colSpan={4} className="p-4 align-middle text-center py-8 text-muted-foreground">
                                            Aucune règle définie.
                                        </td>
                                    </tr>
                                ) : rules.map(rule => (
                                    <tr key={rule.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{rule.name}</td>
                                        <td className="p-4 align-middle">
                                            <div className="text-sm">
                                                {rule.labelContains && <div>Contient: <span className="font-mono bg-muted px-1">{rule.labelContains}</span></div>}
                                                {(rule.amountMin || rule.amountMax) && (
                                                    <div className="text-muted-foreground text-xs">
                                                        Montant: {rule.amountMin || 0} à {rule.amountMax || "∞"}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            Assigner: {getAccountLabel(rule.assignAccountId)}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
