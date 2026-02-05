"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Users,
    Mail,
    Shield,
    Edit,
    Trash2,
    UserCheck,
    Key,
} from "lucide-react";

// Données simulées
const users = [
    {
        id: "1",
        name: "Kofi MENSAH",
        email: "k.mensah@masociete.bj",
        role: "ADMIN",
        isActive: true,
        lastLogin: "18/01/2026 à 08:45",
        createdAt: "15/03/2020",
    },
    {
        id: "2",
        name: "Aïcha DOSSOU",
        email: "a.dossou@masociete.bj",
        role: "ACCOUNTANT",
        isActive: true,
        lastLogin: "17/01/2026 à 16:30",
        createdAt: "01/06/2021",
    },
    {
        id: "3",
        name: "Pierre ADJOVI",
        email: "p.adjovi@masociete.bj",
        role: "USER",
        isActive: true,
        lastLogin: "15/01/2026 à 09:15",
        createdAt: "10/09/2022",
    },
    {
        id: "4",
        name: "Marie AGBO",
        email: "m.agbo@masociete.bj",
        role: "USER",
        isActive: false,
        lastLogin: "10/12/2025 à 11:00",
        createdAt: "05/01/2023",
    },
];

const roleConfig: Record<string, { label: string; color: string; permissions: string }> = {
    ADMIN: {
        label: "Administrateur",
        color: "bg-red-100 text-red-700",
        permissions: "Accès complet",
    },
    ACCOUNTANT: {
        label: "Comptable",
        color: "bg-blue-100 text-blue-700",
        permissions: "Comptabilité, Factures, Rapports",
    },
    USER: {
        label: "Utilisateur",
        color: "bg-slate-100 text-slate-700",
        permissions: "Consultation limitée",
    },
};

export default function UsersSettingsPage() {
    const [searchQuery, setSearchQuery] = React.useState("");

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
                    <p className="text-muted-foreground">
                        Gérez les accès à votre espace ComptaPME
                    </p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Inviter un utilisateur
                </Button>
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
                                <p className="text-sm text-muted-foreground">Total utilisateurs</p>
                                <p className="text-2xl font-bold">{users.length}</p>
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
                                <p className="text-2xl font-bold">{users.filter((u) => u.isActive).length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                                <Shield className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Administrateurs</p>
                                <p className="text-2xl font-bold">{users.filter((u) => u.role === "ADMIN").length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un utilisateur..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Users List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Comptes utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${user.isActive
                                        ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                                        : "bg-slate-400"
                                        }`}>
                                        {user.name.split(" ").map((n) => n[0]).join("")}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{user.name}</h3>
                                            {!user.isActive && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                    Désactivé
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-3.5 w-3.5" />
                                            {user.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="hidden sm:block text-right">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig[user.role].color}`}>
                                            <Shield className="h-3 w-3" />
                                            {roleConfig[user.role].label}
                                        </span>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Dernière connexion: {user.lastLogin}
                                        </p>
                                    </div>

                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Key className="h-4 w-4" />
                                        </Button>
                                        {user.role !== "ADMIN" && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Roles & Permissions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Rôles et permissions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(roleConfig).map(([role, config]) => (
                            <div
                                key={role}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                                        {config.label}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{config.permissions}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
