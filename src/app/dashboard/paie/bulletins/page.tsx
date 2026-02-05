"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    FileText,
    Download,
    Eye,
    CheckCircle2,
    Clock,
} from "lucide-react";
import { useSession } from "next-auth/react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    draft: { label: "Brouillon", color: "bg-slate-100 text-slate-700", icon: Clock },
    pending: { label: "Validé", color: "bg-amber-100 text-amber-700", icon: Clock },
    paid: { label: "Payé", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

interface Payslip {
    id: string;
    period: string;
    employee: string;
    position: string;
    baseSalary: number;
    bonuses: number;
    deductions: number;
    netSalary: number;
    status: string;
    paymentDate: string | null;
}

export default function PayslipsPage() {
    const { data: session } = useSession();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = React.useState(true);
    const [payslips, setPayslips] = React.useState<Payslip[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedPeriod, setSelectedPeriod] = React.useState("");

    React.useEffect(() => {
        const fetchPayslips = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/payroll/payslips?companyId=${session?.user?.companyId}`);
                if (res.ok) {
                    const data: Payslip[] = await res.json();
                    setPayslips(data);
                    // Set default period to most recent if available
                    if (data.length > 0 && !selectedPeriod) {
                        setSelectedPeriod(data[0].period);
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.user?.companyId) {
            fetchPayslips();
        }
    }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

    // Get unique periods for filter
    const periods = Array.from(new Set(payslips.map(p => p.period)));

    const filteredPayslips = payslips.filter(
        (payslip) =>
            (selectedPeriod ? payslip.period === selectedPeriod : true) &&
            (payslip.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payslip.position.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const stats = {
        total: filteredPayslips.length,
        paid: filteredPayslips.filter((p) => p.status === "paid").length,
        totalNetSalary: filteredPayslips.reduce((sum, p) => sum + p.netSalary, 0),
        totalDeductions: filteredPayslips.reduce((sum, p) => sum + p.deductions, 0),
    };

    const downloadPayslip = async (id: string, fileName: string) => {
        try {
            const res = await fetch(`/api/payroll/payslips/${id}/pdf?companyId=${session?.user?.companyId}`);
            if (!res.ok) throw new Error("Erreur téléchargement");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bulletin-${fileName}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bulletins de paie</h1>
                    <p className="text-muted-foreground">
                        Gestion des bulletins de salaire
                    </p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="">Toutes les périodes</option>
                        {periods.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    <Link href="/dashboard/paie/generer">
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Générer la paie
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Bulletins</p>
                                <p className="text-xl font-bold">{stats.total}</p>
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
                                <p className="text-sm text-muted-foreground">Payés</p>
                                <p className="text-xl font-bold">{stats.paid}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Masse salariale nette</p>
                        <p className="text-xl font-bold">{stats.totalNetSalary.toLocaleString("fr-FR")} <span className="text-sm font-normal">XOF</span></p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Cotisations CNSS (Salarial)</p>
                        <p className="text-xl font-bold">{stats.totalDeductions.toLocaleString("fr-FR")} <span className="text-sm font-normal">XOF</span></p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un employé..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Exporter tout
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Payslips Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Liste des Bulletins</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-sm text-muted-foreground">
                                    <th className="text-left py-3 px-4 font-medium">Période</th>
                                    <th className="text-left py-3 px-4 font-medium">Employé</th>
                                    <th className="text-right py-3 px-4 font-medium">Salaire base</th>
                                    <th className="text-right py-3 px-4 font-medium">Net à payer</th>
                                    <th className="text-center py-3 px-4 font-medium">Statut</th>
                                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayslips.map((payslip) => {
                                    const StatusIcon = statusConfig[payslip.status]?.icon || Clock;
                                    const statusLabel = statusConfig[payslip.status]?.label || payslip.status;
                                    const statusColor = statusConfig[payslip.status]?.color || "bg-gray-100";

                                    return (
                                        <tr
                                            key={payslip.id}
                                            className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                                        >
                                            <td className="py-3 px-4 text-sm font-medium">
                                                {payslip.period}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs">
                                                        {payslip.employee.split(" ").map((n: string) => n[0]).join("")}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{payslip.employee}</p>
                                                        <p className="text-xs text-muted-foreground">{payslip.position}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right text-sm">
                                                {payslip.baseSalary.toLocaleString("fr-FR")} <span className="text-xs text-muted-foreground">XOF</span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-sm">
                                                {payslip.netSalary.toLocaleString("fr-FR")} <span className="text-xs text-muted-foreground">XOF</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => downloadPayslip(payslip.id, payslip.employee)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredPayslips.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">Aucun bulletin trouvé</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
