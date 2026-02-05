"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import {
    ArrowLeft,
    Save,
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
} from "lucide-react";

const clientSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    contact: z.string().optional(),
    email: z.string().email("Format d'email invalide").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    ifu: z.string().optional(),
    rccm: z.string().optional(),
    paymentTermDays: z.coerce.number().min(0).max(365),
});

type ClientFormData = {
    name: string;
    paymentTermDays: number;
    contact?: string;
    email?: string;
    phone?: string;
    address?: string;
    ifu?: string;
    rccm?: string;
};

export default function NewClientPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const toast = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema) as never,
        defaultValues: {
            paymentTermDays: 30,
        },
    });

    const onSubmit = async (data: ClientFormData) => {
        try {
            setIsLoading(true);
            setError(null);

            // Récupérer companyId depuis la session
            const companyId = session?.user?.companyId;

            if (!companyId) {
                throw new Error("Session invalide. Veuillez vous reconnecter.");
            }

            const response = await fetch("/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, companyId }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Erreur lors de la création");
            }

            toast.success("Client créé avec succès");
            router.push("/dashboard/ventes/clients");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Une erreur est survenue";
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/ventes/clients">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nouveau client</h1>
                    <p className="text-muted-foreground">
                        Ajoutez un nouveau client à votre portefeuille
                    </p>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6">
                    {/* Informations générales */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Informations générales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="name" required>
                                        Nom / Raison sociale
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: SARL TechBenin"
                                        error={errors.name?.message}
                                        {...register("name")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contact">
                                        <User className="inline h-4 w-4 mr-1" />
                                        Personne de contact
                                    </Label>
                                    <Input
                                        id="contact"
                                        placeholder="Ex: M. Koffi Mensah"
                                        {...register("contact")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        <Phone className="inline h-4 w-4 mr-1" />
                                        Téléphone
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+229 97 12 34 56"
                                        {...register("phone")}
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="email">
                                        <Mail className="inline h-4 w-4 mr-1" />
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="contact@client.com"
                                        error={errors.email?.message}
                                        {...register("email")}
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="address">
                                        <MapPin className="inline h-4 w-4 mr-1" />
                                        Adresse
                                    </Label>
                                    <Input
                                        id="address"
                                        placeholder="Ex: Cotonou, Bénin"
                                        {...register("address")}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informations fiscales */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Informations fiscales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="ifu">IFU (Identifiant Fiscal Unique)</Label>
                                    <Input
                                        id="ifu"
                                        placeholder="Ex: 3201501234567"
                                        {...register("ifu")}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        13 chiffres commençant par 320
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rccm">RCCM</Label>
                                    <Input
                                        id="rccm"
                                        placeholder="Ex: RB/COT/2025/B/12345"
                                        {...register("rccm")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="paymentTermDays">Délai de paiement (jours)</Label>
                                    <Input
                                        id="paymentTermDays"
                                        type="number"
                                        min="0"
                                        max="365"
                                        {...register("paymentTermDays")}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link href="/dashboard/ventes/clients">
                            <Button type="button" variant="outline">
                                Annuler
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-indigo-700"
                            isLoading={isLoading}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Enregistrer le client
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
