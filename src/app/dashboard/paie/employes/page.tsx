"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Users,
    Phone,
    Mail,
    Calendar,
    Wallet,
    FileText,
    Edit,
    MoreHorizontal,
    UserCheck,
    UserX,
    Loader2
} from "lucide-react";
import { format } from "date-fns";

const contractColors: Record<string, string> = {
    CDI: "bg-emerald-100 text-emerald-700",
    CDD: "bg-amber-100 text-amber-700",
    STAGE: "bg-blue-100 text-blue-700",
    INTERIM: "bg-violet-100 text-violet-700",
    CONSULTANT: "bg-slate-100 text-slate-700",
};

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    department?: string;
    email?: string;
    phone?: string;
    hireDate: string;
    baseSalary: number;
    contractType: string;
    cnssNumber?: string;
    isActive: boolean;
}

export default function EmployeesPage() {
    const { data: session } = useSession();
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");

    const fetchEmployees = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/payroll/employees?companyId=${session?.user?.companyId}`);
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [session?.user?.companyId]);

    React.useEffect(() => {
        if (session?.user?.companyId) {
            fetchEmployees();
        }
    }, [session, fetchEmployees]);

    const formatDate = (date: string) => {
        if (!date) return "-";
        try {
            return format(new Date(date), "dd/MM/yyyy");
        } catch { return date; }
    };

    const filteredEmployees = employees.filter(
        (emp) =>
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (emp.department && emp.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const stats = {
        total: employees.length,
        active: employees.filter(e => e.isActive).length,
        totalSalaries: employees.filter(e => e.isActive).reduce((sum, e) => sum + e.baseSalary, 0),
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Employés</h1>
                    <p className="text-muted-foreground">
                        Gérez votre personnel et leurs informations
                    </p>
                </div>
                <Link href="/dashboard/paie/employes/nouveau">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvel employé
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total employés</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                                <UserCheck className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Actifs</p>
                                <p className="text-2xl font-bold">{stats.active}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                                <Wallet className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Masse salariale</p>
                                <p className="text-2xl font-bold">{(stats.totalSalaries / 1000000).toFixed(1)}M <span className="text-sm font-normal">XOF</span></p>
                            </div>
                        </div>
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
                        <Link href="/dashboard/paie/bulletins">
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                Bulletins de paie
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Employees Table */}
            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Chargement des employés...</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-sm text-muted-foreground">
                                            <th className="text-left py-3 px-4 font-medium">Employé</th>
                                            <th className="text-left py-3 px-4 font-medium">Poste</th>
                                            <th className="text-left py-3 px-4 font-medium">Contact</th>
                                            <th className="text-left py-3 px-4 font-medium">Contrat</th>
                                            <th className="text-right py-3 px-4 font-medium">Salaire base</th>
                                            <th className="text-center py-3 px-4 font-medium">Statut</th>
                                            <th className="text-right py-3 px-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEmployees.map((employee) => (
                                            <tr
                                                key={employee.id}
                                                className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                                                            {employee.firstName[0]}{employee.lastName[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                                                            <p className="text-xs text-muted-foreground">CNSS: {employee.cnssNumber || "-"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="font-medium text-sm">{employee.position}</p>
                                                    <p className="text-xs text-muted-foreground">{employee.department}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col gap-1 text-sm">
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <Mail className="h-3.5 w-3.5" />
                                                            <span className="truncate max-w-32">{employee.email || "-"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <Phone className="h-3.5 w-3.5" />
                                                            <span>{employee.phone || "-"}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${contractColors[employee.contractType] || 'bg-gray-100 text-gray-700'}`}>
                                                        {employee.contractType}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        <Calendar className="inline h-3 w-3 mr-1" />
                                                        {formatDate(employee.hireDate)}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold">
                                                    {Number(employee.baseSalary).toLocaleString("fr-FR")} XOF
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {employee.isActive ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                            <UserCheck className="h-3 w-3" /> Actif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                                            <UserX className="h-3 w-3" /> Inactif
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredEmployees.length === 0 && (
                                <div className="text-center py-12">
                                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground">Aucun employé trouvé</p>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
