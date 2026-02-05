"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { Calculator, Mail, Lock, User, Building2, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || "Erreur lors de l'inscription");
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch {
            setError("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
                <Card className="w-full max-w-md text-center shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                    <CardContent className="pt-10 pb-8">
                        <div className="flex justify-center mb-4">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Compte créé !</h2>
                        <p className="text-muted-foreground">
                            Redirection vers la page de connexion...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <CardHeader className="text-center pb-2">
                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/30">
                            <Calculator className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        Créer un compte <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">ComptaPME</span>
                    </CardTitle>
                    <CardDescription>
                        Inscrivez votre entreprise en quelques étapes
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName" required>Nom de l&apos;entreprise</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="companyName"
                                    type="text"
                                    placeholder="Ma Société SARL"
                                    className="pl-10"
                                    error={errors.companyName?.message}
                                    {...register("companyName")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name" required>Votre nom</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Jean Dupont"
                                    className="pl-10"
                                    error={errors.name?.message}
                                    {...register("name")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" required>Email professionnel</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="contact@masociete.com"
                                    className="pl-10"
                                    error={errors.email?.message}
                                    {...register("email")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" required>Mot de passe</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    error={errors.password?.message}
                                    {...register("password")}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Min. 8 caractères avec majuscule, minuscule et chiffre
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" required>Confirmer le mot de passe</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    error={errors.confirmPassword?.message}
                                    {...register("confirmPassword")}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-500/25"
                            size="lg"
                            isLoading={isLoading}
                        >
                            Créer mon compte
                        </Button>
                    </form>

                    <p className="mt-4 text-xs text-center text-muted-foreground">
                        En créant un compte, vous acceptez nos{" "}
                        <Link href="/terms" className="underline hover:text-primary">
                            Conditions d&apos;utilisation
                        </Link>{" "}
                        et notre{" "}
                        <Link href="/privacy" className="underline hover:text-primary">
                            Politique de confidentialité
                        </Link>
                    </p>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">Déjà un compte ?</span>{" "}
                        <Link href="/login" className="font-semibold text-primary hover:underline">
                            Se connecter
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
