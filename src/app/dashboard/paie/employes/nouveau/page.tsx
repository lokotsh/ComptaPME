"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
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

const employeeFormSchema = z.object({
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide").or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),

    // Administratif
    cnssNumber: z.string().optional(),
    ifu: z.string().optional(),

    // Contrat
    hireDate: z.string().min(1, "Date d'embauche requise"),
    contractType: z.enum(["CDI", "CDD", "STAGE", "INTERIM", "CONSULTANT"]),
    position: z.string().min(2, "Le poste est requis"),
    department: z.string().optional(),

    // Salaire
    // Using coerce.number to handle string input from <Input type="number" /> safely
    baseSalary: z.number().min(0, "Le salaire doit être positif"),
    paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "CHECK", "MOBILE_MONEY"]),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export default function NewEmployeePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const toaster = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeFormSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            cnssNumber: "",
            ifu: "",
            hireDate: new Date().toISOString().split("T")[0],
            contractType: "CDI",
            position: "",
            department: "",
            baseSalary: 0,
            paymentMethod: "BANK_TRANSFER",
            bankName: "",
            bankAccountNumber: "",
        },
    });

    const onSubmit = async (values: EmployeeFormValues) => {
        if (!session?.user?.companyId) return;
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/payroll/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId: session.user.companyId,
                    ...values,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Erreur lors de la création");
            }

            toaster.success("Employé créé avec succès");
            router.push("/dashboard/paie/employes");
        } catch (error) {
            console.error(error);
            toaster.error(error instanceof Error ? error.message : "Erreur inconnue");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/paie/employes">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nouvel employé</h1>
                    <p className="text-muted-foreground">
                        Ajoutez un nouveau collaborateur à votre effectif
                    </p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Identité */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informations personnelles</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "firstName"> }) => (
                                    <FormItem>
                                        <FormLabel>Prénom <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Jean" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "lastName"> }) => (
                                    <FormItem>
                                        <FormLabel>Nom <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: DUPONT" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "email"> }) => (
                                    <FormItem>
                                        <FormLabel>Email professionnel</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: jean.dupont@entreprise.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "phone"> }) => (
                                    <FormItem>
                                        <FormLabel>Téléphone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: +229 97 00 00 00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "address"> }) => (
                                        <FormItem>
                                            <FormLabel>Adresse complète</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Quartier Jak, Cotonou" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contrat & Poste */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Contrat & Poste</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="position"
                                render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "position"> }) => (
                                    <FormItem>
                                        <FormLabel>Intitulé du poste <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Comptable Senior" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "department"> }) => (
                                    <FormItem>
                                        <FormLabel>Département / Service</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Finance" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contractType"
                                render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "contractType"> }) => (
                                    <FormItem>
                                        <FormLabel>Type de contrat <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CDI">CDI - Indéterminée</SelectItem>
                                                <SelectItem value="CDD">CDD - Déterminée</SelectItem>
                                                <SelectItem value="STAGE">Stage</SelectItem>
                                                <SelectItem value="INTERIM">Intérim</SelectItem>
                                                <SelectItem value="CONSULTANT">Consultant Externe</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="hireDate"
                                render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "hireDate"> }) => (
                                    <FormItem>
                                        <FormLabel>Date d&apos;embauche <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cnssNumber"
                                render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "cnssNumber"> }) => (
                                    <FormItem>
                                        <FormLabel>Numéro CNSS</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Numéro d'immatriculation sociale" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ifu"
                                render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "ifu"> }) => (
                                    <FormItem>
                                        <FormLabel>Numéro IFU (Fiscal)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Identifiant Fiscal Unique" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Rémunération */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Rémunération & Banque</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="baseSalary"
                                render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "baseSalary"> }) => (
                                    <FormItem>
                                        <FormLabel>Salaire de base (Brut Mensuel) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">XOF</span>
                                            </div>
                                        </FormControl>
                                        <FormDescription>Montant brut soumis à cotisations</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "paymentMethod"> }) => (
                                    <FormItem>
                                        <FormLabel>Mode de paiement</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="BANK_TRANSFER">Virement Bancaire</SelectItem>
                                                <SelectItem value="CHECK">Chèque</SelectItem>
                                                <SelectItem value="CASH">Espèces</SelectItem>
                                                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch("paymentMethod") === "BANK_TRANSFER" && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="bankName"
                                        render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "bankName"> }) => (
                                            <FormItem>
                                                <FormLabel>Nom de la banque</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: BOA, Ecobank..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bankAccountNumber"
                                        render={({ field }: { field: ControllerRenderProps<EmployeeFormValues, "bankAccountNumber"> }) => (
                                            <FormItem>
                                                <FormLabel>RIB / Numéro de compte</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Numéro complet" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Link href="/dashboard/paie/employes">
                            <Button variant="outline" type="button">Annuler</Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-indigo-700">
                            Create Employee
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
