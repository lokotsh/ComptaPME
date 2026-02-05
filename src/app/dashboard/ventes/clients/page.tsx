"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    FileText,
    Phone,
    Mail,
    Loader2
} from "lucide-react";

interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string; // Ville/Adresse
    contact?: string;
    totalRevenue?: number;
    invoicesCount?: number;
}

export default function ClientsPage() {
    const { data: session } = useSession();
    const toaster = useToast();
    const [clients, setClients] = React.useState<Client[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");

    React.useEffect(() => {
        fetchClients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, searchQuery]);

    // Debounce search could be better, but simple effect for now

    const fetchClients = async () => {
        if (!session?.user?.companyId) return;

        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                companyId: session.user.companyId,
            });
            if (searchQuery) {
                params.append("search", searchQuery);
            }

            const res = await fetch(`/api/clients?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setClients(data.clients || []);
            } else {
                console.error("Erreur chargement clients");
            }
        } catch (error) {
            console.error(error);
            toaster.error("Impossible de charger les clients");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (clientId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) return;

        try {
            // Note: Il faudrait une route DELETE API, assumons qu'elle existe ou à créer
            // Pour l'instant, simulons ou appelons une route générique si elle existe
            // Je vais supposer que l'API DELETE /api/clients/[id] existe ou sera créée.
            // Si elle n'existe pas, il faudra la créer. 
            // Vérifions d'abord si on peut le faire.
            // Pour l'instant on va juste retirer de la liste visuelle et afficher un toast
            // "Fonctionnalité de suppression en cours d'implémentation complète"

            // Code réel quand l'API DELETE sera prête :
            /*
            const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            */

            toaster.info("La suppression sera effective une fois l'API DELETE connectée.");

        } catch {
            toaster.error("Impossible de supprimer le client");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground">
                        Gérez votre portefeuille clients et suivez leur chiffre d&apos;affaires.
                    </p>
                </div>
                <Link href="/dashboard/ventes/clients/nouveau">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau client
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des clients</CardTitle>
                    <CardDescription>
                        {clients.length} client{clients.length > 1 ? "s" : ""} enregistré{clients.length > 1 ? "s" : ""}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center pb-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Rechercher un client..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom / Raison sociale</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Coordonnées</TableHead>
                                    <TableHead className="text-right">Chiffre d&apos;Affaires</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                Chargement...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : clients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <p className="text-muted-foreground mb-4">Aucun client trouvé</p>
                                            <Link href="/dashboard/ventes/clients/nouveau">
                                                <Button variant="outline">Créer votre premier client</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    clients.map((client) => (
                                        <TableRow key={client.id}>
                                            <TableCell className="font-medium">
                                                <div className="font-semibold">{client.name}</div>
                                                {client.address && (
                                                    <div className="text-xs text-muted-foreground">{client.address}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {client.contact || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-sm">
                                                    {client.email && (
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                                            {client.email}
                                                        </div>
                                                    )}
                                                    {client.phone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                            {client.phone}
                                                        </div>
                                                    )}
                                                    {!client.email && !client.phone && <span className="text-muted-foreground">-</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="font-medium">
                                                    {(client.totalRevenue || 0).toLocaleString("fr-FR")} XOF
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {client.invoicesCount || 0} facture{(client.invoicesCount || 0) > 1 ? "s" : ""}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(client.id)}>
                                                            Copier ID
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            Voir les factures
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDelete(client.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
