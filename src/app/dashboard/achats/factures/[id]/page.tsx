"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
    ArrowLeft,
    Calendar,
    CreditCard,
    Download,
    FileText,
    MoreVertical,
    Paperclip,
    Plus,
    Printer,
    Trash2,
    Upload,
    User,
    Wallet
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type InvoiceDetail = {
    id: string;
    number: string;
    supplier: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
    };
    issueDate: string;
    dueDate: string;
    receiptDate: string;
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    amountPaid: number;
    status: string;
    notes: string | null;
    lines: Array<{
        id: string;
        description: string;
        quantity: number;
        unitPriceHT: number;
        tvaRate: number;
        totalHT: number;
        totalTTC: number;
    }>;
    payments: Array<{
        id: string;
        amount: number;
        paymentDate: string;
        paymentMethod: string;
        reference: string | null;
    }>;
    documents: Array<{
        id: string;
        fileName: string;
        originalName: string;
        size: number;
        path: string;
        createdAt: string;
    }>;
};

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "En attente", className: "bg-amber-100 text-amber-700 hover:bg-amber-100/80" },
    APPROVED: { label: "Validée", className: "bg-blue-100 text-blue-700 hover:bg-blue-100/80" },
    PARTIALLY_PAID: { label: "Partiellement payée", className: "bg-orange-100 text-orange-700 hover:bg-orange-100/80" },
    PAID: { label: "Payée", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80" },
    CANCELLED: { label: "Annulée", className: "bg-slate-100 text-slate-500 hover:bg-slate-100/80" },
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const toaster = useToast();
    const { data: session } = useSession();

    const [invoice, setInvoice] = React.useState<InvoiceDetail | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState(false);

    // Paiement state
    const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
    const [paymentAmount, setPaymentAmount] = React.useState("");
    const [paymentMethod, setPaymentMethod] = React.useState("BANK_TRANSFER");
    const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [isSubmittingPayment, setIsSubmittingPayment] = React.useState(false);

    const fetchInvoice = React.useCallback(async () => {
        if (!session?.user?.companyId) return;
        try {
            const res = await fetch(`/api/suppliers/invoices/${id}?companyId=${session.user.companyId}`);
            if (!res.ok) throw new Error("Facture introuvable");
            const data = await res.json();
            setInvoice(data);

            // Pré-remplir le reste à payer
            const remaining = Number(data.totalTTC) - Number(data.amountPaid);
            setPaymentAmount(remaining > 0 ? remaining.toString() : "0");
        } catch (error) {
            console.error(error);
            toaster.error("Impossible de charger la facture");
            router.push("/dashboard/achats/factures");
        } finally {
            setIsLoading(false);
        }
    }, [id, session, router, toaster]);

    React.useEffect(() => {
        fetchInvoice();
    }, [fetchInvoice]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !session?.user?.companyId || !invoice) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("companyId", session.user.companyId);
        formData.append("refType", "supplier_invoice");
        formData.append("refId", invoice.id);

        setIsUploading(true);
        try {
            const res = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erreur upload");
            }

            toaster.success("Document ajouté avec succès");
            fetchInvoice(); // Rafraîchir
        } catch (error) {
            console.error(error);
            toaster.error(error instanceof Error ? error.message : "Erreur lors de l'upload");
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice) return;

        setIsSubmittingPayment(true);
        try {
            const amount = parseFloat(paymentAmount);
            const res = await fetch(`/api/suppliers/invoices/${invoice.id}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount,
                    paymentDate,
                    paymentMethod,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erreur paiement");
            }

            toaster.success("Paiement enregistré");
            setIsPaymentOpen(false);
            fetchInvoice();
        } catch (error) {
            toaster.error(error instanceof Error ? error.message : "Erreur lors du paiement");
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleDelete = async () => {
        if (!invoice || !session?.user?.companyId) return;
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible.")) return;

        try {
            const res = await fetch(`/api/suppliers/invoices/${invoice.id}?companyId=${session.user.companyId}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erreur lors de la suppression");
            }

            toaster.success("Facture supprimée avec succès");
            router.push("/dashboard/achats/factures");
        } catch (error) {
            console.error(error);
            toaster.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!invoice) return null;

    const remainingAmount = Number(invoice.totalTTC) - Number(invoice.amountPaid);
    const isPaid = remainingAmount <= 0;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/achats/factures">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{invoice.number}</h1>
                            <Badge className={statusConfig[invoice.status]?.className || ""}>
                                {statusConfig[invoice.status]?.label || invoice.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            {invoice.supplier.name} • {format(new Date(invoice.issueDate), "dd MMMM yyyy")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isPaid && (
                        <Button onClick={() => setIsPaymentOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-700">
                            <Wallet className="mr-2 h-4 w-4" />
                            Enregistrer un paiement
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.print()}>
                                <Printer className="mr-2 h-4 w-4" /> Imprimer
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Invoice Lines */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Détails de la facture</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-hidden rounded-md">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Description</th>
                                            <th className="px-4 py-3 text-right font-medium">Qté</th>
                                            <th className="px-4 py-3 text-right font-medium">Prix U.</th>
                                            <th className="px-4 py-3 text-right font-medium">TVA</th>
                                            <th className="px-4 py-3 text-right font-medium">Total HT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {invoice.lines.map((line) => (
                                            <tr key={line.id} className="hover:bg-muted/10">
                                                <td className="px-4 py-3">{line.description}</td>
                                                <td className="px-4 py-3 text-right">{Number(line.quantity)}</td>
                                                <td className="px-4 py-3 text-right">{Number(line.unitPriceHT).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right">{Number(line.tvaRate)}%</td>
                                                <td className="px-4 py-3 text-right font-medium">{Number(line.totalHT).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col items-end gap-2 pt-6 bg-muted/20">
                            <div className="flex justify-between w-full sm:w-64">
                                <span className="text-muted-foreground">Total HT</span>
                                <span>{Number(invoice.totalHT).toLocaleString()} XOF</span>
                            </div>
                            <div className="flex justify-between w-full sm:w-64">
                                <span className="text-muted-foreground">Total TVA</span>
                                <span>{Number(invoice.totalTVA).toLocaleString()} XOF</span>
                            </div>
                            <Separator className="my-2 w-full sm:w-64" />
                            <div className="flex justify-between w-full sm:w-64 font-bold text-lg">
                                <span>Total TTC</span>
                                <span className="text-blue-600">{Number(invoice.totalTTC).toLocaleString()} XOF</span>
                            </div>
                            <div className="flex justify-between w-full sm:w-64 text-sm mt-1">
                                <span className="text-muted-foreground">Déjà payé</span>
                                <span className="text-emerald-600">{Number(invoice.amountPaid).toLocaleString()} XOF</span>
                            </div>
                            {remainingAmount > 0 && (
                                <div className="flex justify-between w-full sm:w-64 text-sm font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                    <span>Reste à payer</span>
                                    <span>{remainingAmount.toLocaleString()} XOF</span>
                                </div>
                            )}
                        </CardFooter>
                    </Card>

                    {/* Payments History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CreditCard className="h-4 w-4" /> Historique des paiements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {invoice.payments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Aucun paiement enregistré</p>
                            ) : (
                                <div className="space-y-4">
                                    {invoice.payments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/40 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                    <Wallet className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Paiement reçu</p>
                                                    <p className="text-xs text-muted-foreground">{format(new Date(payment.paymentDate), "dd MMM yyyy")} • {payment.paymentMethod}</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold">{Number(payment.amount).toLocaleString()} XOF</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Supplier Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" /> Fournisseur
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <p className="font-medium">{invoice.supplier.name}</p>
                            </div>
                            {invoice.supplier.email && (
                                <div className="grid grid-cols-3 gap-1">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="col-span-2 truncate">{invoice.supplier.email}</span>
                                </div>
                            )}
                            {invoice.supplier.phone && (
                                <div className="grid grid-cols-3 gap-1">
                                    <span className="text-muted-foreground">Tél:</span>
                                    <span className="col-span-2">{invoice.supplier.phone}</span>
                                </div>
                            )}
                            {invoice.supplier.address && (
                                <div className="grid grid-cols-3 gap-1">
                                    <span className="text-muted-foreground">Adresse:</span>
                                    <span className="col-span-2">{invoice.supplier.address}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Dates */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Dates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Émission</span>
                                <span>{format(new Date(invoice.issueDate), "dd/MM/yyyy")}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Réception</span>
                                <span>{format(new Date(invoice.receiptDate), "dd/MM/yyyy")}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t font-medium">
                                <span className="text-red-600">Échéance</span>
                                <span>{format(new Date(invoice.dueDate), "dd/MM/yyyy")}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Paperclip className="h-4 w-4" /> Documents
                            </CardTitle>
                            <Label htmlFor="upload-doc" className="cursor-pointer">
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                    <div className="h-8 w-8 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                )}
                                <Input
                                    id="upload-doc"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </Label>
                        </CardHeader>
                        <CardContent>
                            {invoice.documents.length === 0 ? (
                                <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/10">
                                    <Upload className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
                                    <p className="text-xs text-muted-foreground">Aucun document joint</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {invoice.documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-2 rounded border bg-card text-sm group">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                                <span className="truncate" title={doc.originalName}>{doc.originalName}</span>
                                            </div>
                                            <a href={doc.path} target="_blank" rel="noreferrer" className="shrink-0 p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                                                <Download className="h-3.5 w-3.5" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modal de paiement */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enregistrer un paiement</DialogTitle>
                        <DialogDescription>
                            Saisissez les détails du règlement pour la facture {invoice.number}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Montant à payer</Label>
                            <div className="relative">
                                <Input
                                    id="amount"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    max={remainingAmount}
                                    required
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    XOF
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Reste à payer : {remainingAmount.toLocaleString("fr-FR")} XOF
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Date de paiement</Label>
                            <Input
                                id="date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="method">Mode de paiement</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK_TRANSFER">Virement Bancaire</SelectItem>
                                    <SelectItem value="CASH">Espèces</SelectItem>
                                    <SelectItem value="CHECK">Chèque</SelectItem>
                                    <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSubmittingPayment}>
                                {isSubmittingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
