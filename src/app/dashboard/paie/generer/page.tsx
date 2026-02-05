"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Calculator,
    Save,
    Calendar,
    Building2,
    Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

// Barèmes (Frontend Preview - must match Backend)
const CNSS_RATES = {
    employeeRate: 0.036,
    employerRate: 0.154,
};

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    baseSalary: number;
}

interface PayrollCalculation {
    baseSalary: number;
    bonuses: number;
    grossSalary: number;
    cnssEmployee: number;
    its: number;
    netSalary: number;
    cnssEmployer: number;
    totalCost: number;
}

export default function GeneratePayrollPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const toaster = useToast();

    // Period selection
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [selectedPeriod, setSelectedPeriod] = React.useState(currentMonthStr);

    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [variables, setVariables] = React.useState<Record<string, { bonuses: number; deductions: number }>>({});
    const [calculations, setCalculations] = React.useState<Record<string, PayrollCalculation>>({});

    const [isLoading, setIsLoading] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Initial Fetch
    React.useEffect(() => {
        const fetchEmployees = async () => {
            if (!session?.user?.companyId) return;
            setIsLoading(true);
            try {
                const res = await fetch(`/api/payroll/employees?companyId=${session?.user?.companyId}`);
                if (res.ok) {
                    const data: Array<{ id: string; firstName: string; lastName: string; baseSalary: number | string; isActive: boolean }> = await res.json();
                    // Filter active employees and map
                    const activeEmps = data.filter(e => e.isActive).map(e => ({
                        id: e.id,
                        firstName: e.firstName,
                        lastName: e.lastName,
                        baseSalary: Number(e.baseSalary)
                    }));
                    setEmployees(activeEmps);

                    // Init variables
                    const vars: Record<string, { bonuses: number; deductions: number }> = {};
                    activeEmps.forEach(e => {
                        vars[e.id] = { bonuses: 0, deductions: 0 };
                    });
                    setVariables(vars);
                }
            } catch (error) {
                console.error(error);
                toaster.error("Erreur chargement employés");
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.user?.companyId) {
            fetchEmployees();
        }
    }, [session, toaster]);

    // Calculation Logic
    const calculateITS = (taxableIncome: number): number => {
        if (taxableIncome <= 50000) return 0;
        let tax = 0;
        const amount = taxableIncome;

        // Tranche 1
        if (amount > 130000) tax += (130000 - 50000) * 0.10;
        else return Math.floor((amount - 50000) * 0.10);

        // Tranche 2
        if (amount > 280000) tax += (280000 - 130000) * 0.15;
        else return Math.floor(tax + (amount - 130000) * 0.15);

        // Tranche 3
        tax += (amount - 280000) * 0.20;

        return Math.floor(tax);
    };

    const calculateSingle = (emp: Employee, bonuses: number = 0) => {
        const grossSalary = emp.baseSalary + bonuses;
        const cnssEmployee = Math.ceil(grossSalary * CNSS_RATES.employeeRate);
        const taxableBase = grossSalary - cnssEmployee;
        const its = calculateITS(taxableBase);
        const netSalary = grossSalary - cnssEmployee - its;
        const cnssEmployer = Math.ceil(grossSalary * CNSS_RATES.employerRate);

        return {
            baseSalary: emp.baseSalary,
            bonuses,
            grossSalary,
            cnssEmployee,
            its,
            netSalary,
            cnssEmployer,
            totalCost: grossSalary + cnssEmployer
        };
    };

    const handleCalculateAll = () => {
        const newCalcs: Record<string, PayrollCalculation> = {};
        employees.forEach(emp => {
            const vars = variables[emp.id] || { bonuses: 0 };
            newCalcs[emp.id] = calculateSingle(emp, vars.bonuses);
        });
        setCalculations(newCalcs);
        toaster.success("Calcul effectué");
    };

    const updateVariable = (id: string, field: "bonuses" | "deductions", value: number) => {
        setVariables(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleValidate = async () => {
        if (!session?.user?.companyId) return;
        setIsSubmitting(true);

        const [yearStr, monthStr] = selectedPeriod.split("-");
        const payload = {
            year: parseInt(yearStr),
            month: parseInt(monthStr),
            paymentDate: new Date().toISOString(), // Default today
            variables: Object.entries(variables).map(([empId, vars]) => ({
                employeeId: empId,
                bonuses: vars.bonuses,
                deductions: vars.deductions
            }))
        };

        try {
            const res = await fetch(`/api/payroll/run?companyId=${session.user.companyId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erreur validation");
            }

            toaster.success("Paie générée et validée !");
            router.push("/dashboard/paie/bulletins");

        } catch (error) {
            console.error(error);
            toaster.error(error instanceof Error ? error.message : "Erreur");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Totals
    const totals = Object.values(calculations).reduce((acc, c) => ({
        gross: acc.gross + c.grossSalary,
        cnssEmp: acc.cnssEmp + c.cnssEmployee,
        its: acc.its + c.its,
        net: acc.net + c.netSalary,
        cnssEmplr: acc.cnssEmplr + c.cnssEmployer,
        cost: acc.cost + c.totalCost,
    }), { gross: 0, cnssEmp: 0, its: 0, net: 0, cnssEmplr: 0, cost: 0 });

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/paie/bulletins">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Générer la paie</h1>
                    <p className="text-muted-foreground">
                        Préparation des bulletins mensuels
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                        type="month"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="w-40"
                    />
                </div>
            </div>

            {/* Rates Info */}
            <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">Barèmes CNSS & Fiscalité (Simulation)</p>
                            <p className="text-sm text-muted-foreground">
                                CNSS Employé: 3.6% | CNSS Patronal: 15.4% | IRPP: Progressif
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleCalculateAll} disabled={employees.length === 0}>
                            <Calculator className="mr-2 h-4 w-4" />
                            Calculer l&apos;aperçu
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Employees Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Saisie des variables ({employees.length} employés)</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-8 text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            Aucun employé actif trouvé.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-muted-foreground">
                                        <th className="text-left py-3 px-4 font-medium">Employé</th>
                                        <th className="text-right py-3 px-4 font-medium">Salaire base</th>
                                        <th className="text-right py-3 px-4 font-medium w-32">Primes (Brut)</th>
                                        <th className="text-right py-3 px-4 font-medium">Brut Total</th>
                                        <th className="text-right py-3 px-4 font-medium">CNSS (3.6%)</th>
                                        <th className="text-right py-3 px-4 font-medium">IRPP</th>
                                        <th className="text-right py-3 px-4 font-medium text-emerald-600">Net à Payer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((employee) => {
                                        const calc = calculations[employee.id];
                                        return (
                                            <tr key={employee.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="py-3 px-4 font-medium">
                                                    {employee.firstName} {employee.lastName}
                                                </td>
                                                <td className="py-3 px-4 text-right text-muted-foreground">
                                                    {employee.baseSalary.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={variables[employee.id]?.bonuses || ""}
                                                        onChange={(e) => updateVariable(employee.id, "bonuses", Number(e.target.value))}
                                                        className="text-right h-8 w-full"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium">
                                                    {calc ? calc.grossSalary.toLocaleString() : "-"}
                                                </td>
                                                <td className="py-3 px-4 text-right text-red-600/80">
                                                    {calc ? `-${calc.cnssEmployee.toLocaleString()}` : "-"}
                                                </td>
                                                <td className="py-3 px-4 text-right text-red-600/80">
                                                    {calc ? `-${calc.its.toLocaleString()}` : "-"}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-emerald-600">
                                                    {calc ? calc.netSalary.toLocaleString() : "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {Object.keys(calculations).length > 0 && (
                                    <tfoot className="bg-muted/50 font-semibold">
                                        <tr>
                                            <td className="py-3 px-4" colSpan={3}>TOTAUX</td>
                                            <td className="py-3 px-4 text-right">{totals.gross.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-red-600">-{totals.cnssEmp.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-red-600">-{totals.its.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-emerald-600">{totals.net.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {Object.keys(calculations).length > 0 && (
                <div className="grid gap-4 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Total CNSS (Patronal + Salarial)</p>
                            <p className="text-2xl font-bold text-violet-600">
                                {(totals.cnssEmp + totals.cnssEmplr).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">XOF</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Dont {totals.cnssEmplr.toLocaleString()} charge patronale</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Total Impôts (IRPP)</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {totals.its.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">XOF</span>
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <p className="text-sm text-primary font-medium">Coût Total Entreprise</p>
                            <p className="text-2xl font-bold text-primary">
                                {totals.cost.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">XOF</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
                <Link href="/dashboard/paie/bulletins">
                    <Button variant="outline">Annuler</Button>
                </Link>
                <Button
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 w-48"
                    onClick={handleValidate}
                    disabled={Object.keys(calculations).length === 0 || isSubmitting}
                >
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Valider la Paie
                </Button>
            </div>
        </div>
    );
}
