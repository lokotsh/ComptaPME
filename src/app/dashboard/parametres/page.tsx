"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
    Building2,
    Users,
    Shield,
    Bell,
    CreditCard,
    FileText,
    Database,
    ChevronRight,
    ShieldAlert,
} from "lucide-react";

const settingsCategories = [
    {
        title: "Entreprise",
        description: "Informations et identité de votre société",
        icon: Building2,
        color: "bg-blue-100 text-blue-600",
        href: "/dashboard/parametres/entreprise",
    },
    {
        title: "Utilisateurs",
        description: "Gérer les comptes et accès",
        icon: Users,
        color: "bg-emerald-100 text-emerald-600",
        href: "/dashboard/parametres/utilisateurs",
    },
    {
        title: "Rôles & Permissions",
        description: "Définir les droits d'accès",
        icon: Shield,
        color: "bg-red-100 text-red-600",
        href: "/dashboard/parametres/roles",
    },
    {
        title: "Notifications",
        description: "Alertes et rappels automatiques",
        icon: Bell,
        color: "bg-amber-100 text-amber-600",
        href: "/dashboard/parametres/notifications",
    },
    {
        title: "Facturation & Paiement",
        description: "Abonnement et mode de paiement",
        icon: CreditCard,
        color: "bg-violet-100 text-violet-600",
        href: "/dashboard/parametres/facturation",
    },
    {
        title: "Modèles de documents",
        description: "Personnaliser vos factures et devis",
        icon: FileText,
        color: "bg-pink-100 text-pink-600",
        href: "/dashboard/parametres/modeles",
    },
    {
        title: "Import / Export",
        description: "Données et sauvegardes",
        icon: Database,
        color: "bg-slate-100 text-slate-600",
        href: "/dashboard/parametres/donnees",
    },
    {
        title: "Journal d'Audit",
        description: "Historique des actions",
        icon: ShieldAlert,
        color: "bg-orange-100 text-orange-600",
        href: "/dashboard/parametres/logs",
    },
    {
        title: "Sécurité & Connexion",
        description: "2FA et mot de passe",
        icon: Shield,
        color: "bg-red-100 text-red-600",
        href: "/dashboard/parametres/securite",
    },
];

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">
                    Configurez votre espace ComptaPME
                </p>
            </div>

            {/* Settings Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {settingsCategories.map((category) => (
                    <Link key={category.title} href={category.href}>
                        <Card className="group h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${category.color}`}>
                                        <category.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold">{category.title}</h3>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {category.description}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Info */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-primary/20">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="font-semibold">Votre abonnement</h3>
                            <p className="text-sm text-muted-foreground">
                                Plan <span className="font-medium text-primary">Professionnel</span> • Valide jusqu&apos;au 18/01/2027
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                                Actif
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
