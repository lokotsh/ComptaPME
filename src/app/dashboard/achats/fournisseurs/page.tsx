"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Building2,
    Phone,
    Mail,
    MapPin,
    Edit,
    Trash2,
    FileText,
    TrendingDown,
    Clock,
    Loader2
} from "lucide-react";

interface Supplier {
    id: string;
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
    address?: string;
    ifu?: string;
    invoicesCount: number;
    totalPurchases: number;
    pendingAmount: number;
    isActive: boolean;
}

export default function SuppliersPage() {
    const { data: session } = useSession();
    const toaster = useToast();
    const [searchQuery, setSearchQuery] = React.useState("");
    const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchSuppliers = async () => {
            if (!session?.user?.companyId) return;

            try {
                setIsLoading(true);
                const params = new URLSearchParams({
                    companyId: session.user.companyId,
                });
                if (searchQuery) {
                    params.append("search", searchQuery);
                }

                const res = await fetch(`/api/suppliers?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuppliers(data.suppliers || []);
                }
            } catch (error) {
                console.error(error);
                toaster.error("Impossible de charger les fournisseurs");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuppliers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, searchQuery]);

    const stats = {
        total: suppliers.length,
        active: suppliers.filter(s => s.isActive).length,
        totalPurchases: suppliers.reduce((a, s) => a + (s.totalPurchases || 0), 0),
        pendingAmount: suppliers.reduce((a, s) => a + (s.pendingAmount || 0), 0),
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Fournisseurs</h1>
                    <p className="text-muted-foreground">
                        Gérez vos fournisseurs et leurs factures
                    </p>
                </div>
                <Link href="/dashboard/achats/fournisseurs/nouveau">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau fournisseur
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total fournisseurs</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                                <Building2 className="h-6 w-6 text-emerald-600" />
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
                                <TrendingDown className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total achats</p>
                                <p className="text-2xl font-bold">{(stats.totalPurchases / 1000000).toFixed(1)}M <span className="text-sm font-normal">XOF</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">À payer</p>
                                <p className="text-2xl font-bold text-amber-600">{(stats.pendingAmount / 1000000).toFixed(1)}M <span className="text-sm font-normal">XOF</span></p>
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
                                placeholder="Rechercher un fournisseur..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Link href="/dashboard/achats/factures">
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                Factures fournisseurs
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Suppliers Grid */}
            {isLoading ? (
                <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Chargement des fournisseurs...</p>
                </div>
            ) : suppliers.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-4">Aucun fournisseur trouvé</p>
                        <Link href="/dashboard/achats/fournisseurs/nouveau">
                            <Button>Ajouter votre premier fournisseur</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {suppliers.map((supplier) => (
                        <Card key={supplier.id} className="group hover:shadow-lg hover:border-primary/50 transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                            {supplier.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{supplier.name}</h3>
                                            <p className="text-sm text-muted-foreground">{supplier.contact || "-"}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${supplier.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                        {supplier.isActive ? "Actif" : "Inactif"}
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span className="truncate">{supplier.email || "-"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-4 w-4" />
                                        <span>{supplier.phone || "-"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>{supplier.address || "-"}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-muted-foreground">{supplier.invoicesCount || 0} factures</span>
                                        <span className="font-semibold">{(supplier.totalPurchases || 0).toLocaleString("fr-FR")} XOF</span>
                                    </div>
                                    {(supplier.pendingAmount || 0) > 0 && (
                                        <div className="flex items-center justify-between text-amber-600">
                                            <span className="text-xs">À payer</span>
                                            <span className="font-semibold">{supplier.pendingAmount.toLocaleString("fr-FR")} XOF</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <Edit className="mr-2 h-3.5 w-3.5" />
                                        Modifier
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
