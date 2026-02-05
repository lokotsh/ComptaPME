"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Log {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    user: { name: string; email: string } | null;
    createdAt: string;
    newValues?: string;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = React.useState<Log[]>([]);
    const [filterType, setFilterType] = React.useState("ALL");
    const [search, setSearch] = React.useState("");
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterType]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/logs?type=${filterType}&limit=100`);
            if (res.ok) {
                setLogs(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800';
            case 'UPDATE': return 'bg-blue-100 text-blue-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredLogs = logs.filter(log =>
        log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        log.entityType.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Journal d&apos;Audit</h1>
                    <p className="text-muted-foreground">Tracez toutes les actions sensibles du système.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5" />
                            Historique des actions
                        </CardTitle>
                        <div className="flex gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Type d'entité" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tout voir</SelectItem>
                                    <SelectItem value="INVOICE">Factures</SelectItem>
                                    <SelectItem value="PAYMENT">Paiements</SelectItem>
                                    <SelectItem value="EMPLOYEE">Employés</SelectItem>
                                    <SelectItem value="PAYROLL_RUN">Paie</SelectItem>
                                    <SelectItem value="SETTINGS">Paramètres</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 [&_tr]:border-b">
                                <tr className="border-b transition-colors">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Utilisateur</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cible</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Détails</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">Chargement...</td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">Aucun historique trouvé.</td>
                                    </tr>
                                ) : filteredLogs.map((log) => (
                                    <tr key={log.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle whitespace-nowrap">
                                            {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-medium">{log.user?.name || "Système"}</div>
                                            <div className="text-xs text-muted-foreground">{log.user?.email}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Badge className={getActionColor(log.action)} variant="outline">
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-mono text-xs">{log.entityType}</div>
                                            <div className="text-xs text-muted-foreground">{log.entityId?.slice(0, 8)}...</div>
                                        </td>
                                        <td className="p-4 align-middle max-w-[300px] truncate text-xs text-muted-foreground" title={log.newValues}>
                                            {log.newValues || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
