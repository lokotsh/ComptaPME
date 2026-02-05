"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Link from "next/link";

const invoiceLineSchema = z.object({
    description: z.string().min(1, "La description est requise"),
    quantity: z.number().min(0.001, "La quantité doit être positive"),
    unitPriceHT: z.number().min(0, "Le prix unitaire doit être positif"),
    tvaRate: z.number().min(0),
});

const formSchema = z.object({
    supplierId: z.string().min(1, "Le fournisseur est requis"),
    number: z.string().min(1, "Le numéro de facture est requis"),
    issueDate: z.date(),
    dueDate: z.date(),
    receiptDate: z.date(),
    notes: z.string().optional(),
    lines: z.array(invoiceLineSchema).min(1, "Au moins une ligne est requise"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewSupplierInvoicePage() {
    const router = useRouter();
    const toaster = useToast();
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = React.useState(false);
    const [suppliers, setSuppliers] = React.useState<{ id: string; name: string }[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            number: "",
            supplierId: "",
            notes: "",
            issueDate: new Date(),
            receiptDate: new Date(),
            dueDate: new Date(),
            lines: [{ description: "", quantity: 1, unitPriceHT: 0, tvaRate: 18 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lines",
    });

    // Charger les fournisseurs
    React.useEffect(() => {
        const fetchSuppliers = async () => {
            if (!session?.user?.companyId) return;
            try {
                const response = await fetch(`/api/suppliers?companyId=${session.user.companyId}&limit=100`);
                if (response.ok) {
                    const data = await response.json();
                    setSuppliers(data.suppliers);
                }
            } catch (error) {
                console.error("Erreur chargement fournisseurs:", error);
                toaster.error("Impossible de charger la liste des fournisseurs");
            }
        };

        if (session?.user?.companyId) {
            fetchSuppliers();
        }
    }, [session, toaster]);

    // Calcul des totaux en temps réel
    const watchedLines = form.watch("lines");
    const totals = React.useMemo(() => {
        return watchedLines.reduce(
            (acc, line) => {
                const qty = Number(line.quantity) || 0;
                const price = Number(line.unitPriceHT) || 0;
                const tva = Number(line.tvaRate) || 0;

                const ht = qty * price;
                const tax = ht * (tva / 100);

                return {
                    ht: acc.ht + ht,
                    tva: acc.tva + tax,
                    ttc: acc.ttc + (ht + tax),
                };
            },
            { ht: 0, tva: 0, ttc: 0 }
        );
    }, [watchedLines]);

    const onSubmit = async (data: FormValues) => {
        if (!session?.user?.companyId) return;

        setIsLoading(true);
        try {
            const payload = {
                companyId: session.user.companyId,
                ...data,
                // Convertir les dates en ISO strings
                issueDate: data.issueDate.toISOString(),
                dueDate: data.dueDate.toISOString(),
                receiptDate: data.receiptDate.toISOString(),
            };

            const response = await fetch("/api/suppliers/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                const detailMsg = error.details ? (typeof error.details === 'string' ? error.details : JSON.stringify(error.details)) : "";
                throw new Error(error.error ? `${error.error} ${detailMsg}` : "Erreur lors de la création");
            }

            toaster.success(`La facture ${data.number} a été enregistrée avec succès.`);

            router.push("/dashboard/achats/factures");
            router.refresh();
        } catch (error) {
            console.error(error);
            toaster.error(error instanceof Error ? error.message : "Erreur inconnue");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/achats/factures">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nouvelle facture fournisseur</h1>
                    <p className="text-muted-foreground">Saisissez les détails de la facture reçue</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Informations générales */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informations générales</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="supplierId"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Fournisseur</FormLabel>
                                            <Link href="/dashboard/achats/fournisseurs/nouveau" className="text-xs text-blue-600 hover:underline flex items-center">
                                                <Plus className="h-3 w-3 mr-1" />
                                                Nouveau fournisseur
                                            </Link>
                                        </div>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un fournisseur" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {suppliers.map((supplier) => (
                                                    <SelectItem key={supplier.id} value={supplier.id}>
                                                        {supplier.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Numéro de facture</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: FAC-2026-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="issueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date d&apos;émission</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd/MM/yyyy")
                                                        ) : (
                                                            <span>Choisir une date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="receiptDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date de réception</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd/MM/yyyy")
                                                        ) : (
                                                            <span>Choisir une date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date d&apos;échéance</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd/MM/yyyy")
                                                        ) : (
                                                            <span>Choisir une date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Lignes de facture */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Lignes de la facture</CardTitle>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ description: "", quantity: 1, unitPriceHT: 0, tvaRate: 18 })}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Ajouter une ligne
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="grid gap-4 sm:grid-cols-12 items-end">
                                    <div className="sm:col-span-4">
                                        <FormField
                                            control={form.control}
                                            name={`lines.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Description</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Description du produit/service" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`lines.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Qté</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            {...field}
                                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <FormField
                                            control={form.control}
                                            name={`lines.${index}.unitPriceHT`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Prix Unitaire HT</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            {...field}
                                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`lines.${index}.tvaRate`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>TVA (%)</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            onValueChange={(val) => field.onChange(parseFloat(val))}
                                                            value={field.value?.toString()}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="18">18%</SelectItem>
                                                                <SelectItem value="0">0% (Exonéré)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end pt-4 border-t mt-4">
                                <div className="w-full sm:w-1/3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total HT</span>
                                        <span>{totals.ht.toLocaleString("fr-FR")} XOF</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total TVA</span>
                                        <span>{totals.tva.toLocaleString("fr-FR")} XOF</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                        <span>Total TTC</span>
                                        <span className="text-blue-600">{totals.ttc.toLocaleString("fr-FR")} XOF</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Link href="/dashboard/achats/factures">
                            <Button variant="outline" type="button">Annuler</Button>
                        </Link>
                        <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-indigo-700">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Enregistrer la facture
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
