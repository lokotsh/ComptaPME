// Fonctions utilitaires pour formater les valeurs

/**
 * Formate un nombre en monnaie XOF
 */
export function formatCurrency(
    amount: number,
    options?: { showSymbol?: boolean; showDecimals?: boolean }
): string {
    const { showSymbol = true, showDecimals = false } = options || {};

    const formatted = amount.toLocaleString("fr-FR", {
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
    });

    return showSymbol ? `${formatted} XOF` : formatted;
}

/**
 * Formate une date en français
 */
export function formatDate(
    date: Date | string,
    format: "short" | "long" | "full" = "short"
): string {
    const d = typeof date === "string" ? new Date(date) : date;

    const options: Intl.DateTimeFormatOptions =
        format === "short"
            ? { day: "2-digit", month: "2-digit", year: "numeric" }
            : format === "long"
                ? { day: "2-digit", month: "long", year: "numeric" }
                : { weekday: "long", day: "2-digit", month: "long", year: "numeric" };

    return d.toLocaleDateString("fr-FR", options);
}

/**
 * Formate une date relative (il y a X jours, etc.)
 */
export function formatRelativeDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "À l'instant";
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} ans`;
}

/**
 * Formate un numéro de téléphone béninois
 */
export function formatPhone(phone: string): string {
    // Nettoyer le numéro
    const cleaned = phone.replace(/\D/g, "");

    // Format béninois: +229 XX XX XX XX
    if (cleaned.length === 8) {
        return `+229 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
    }

    if (cleaned.length === 11 && cleaned.startsWith("229")) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
    }

    return phone;
}

/**
 * Génère des initiales à partir d'un nom
 */
export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Tronquer un texte avec ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + "...";
}

/**
 * Calculer le nombre de jours avant/après une échéance
 */
export function getDaysUntil(date: Date | string): {
    days: number;
    label: string;
    isOverdue: boolean;
} {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);

    const diffMs = d.getTime() - now.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (days < 0) {
        return {
            days: Math.abs(days),
            label: `En retard de ${Math.abs(days)} jour${Math.abs(days) > 1 ? "s" : ""}`,
            isOverdue: true,
        };
    }

    if (days === 0) {
        return { days: 0, label: "Échéance aujourd'hui", isOverdue: false };
    }

    if (days === 1) {
        return { days: 1, label: "Échéance demain", isOverdue: false };
    }

    return {
        days,
        label: `Dans ${days} jour${days > 1 ? "s" : ""}`,
        isOverdue: false,
    };
}

/**
 * Valider un IFU béninois
 */
export function validateIFU(ifu: string): boolean {
    // Format IFU Bénin: 13 chiffres débutant par 320
    const cleaned = ifu.replace(/\D/g, "");
    return /^320\d{10}$/.test(cleaned);
}

/**
 * Valider un email
 */
export function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Générer une couleur de badge selon le statut
 */
export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        DRAFT: "bg-slate-100 text-slate-700",
        SENT: "bg-blue-100 text-blue-700",
        PENDING: "bg-amber-100 text-amber-700",
        PARTIALLY_PAID: "bg-orange-100 text-orange-700",
        PAID: "bg-emerald-100 text-emerald-700",
        OVERDUE: "bg-red-100 text-red-700",
        CANCELLED: "bg-slate-100 text-slate-500",
        ACTIVE: "bg-emerald-100 text-emerald-700",
        INACTIVE: "bg-slate-100 text-slate-500",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
}

/**
 * Traduire un statut en français
 */
export function translateStatus(status: string): string {
    const translations: Record<string, string> = {
        DRAFT: "Brouillon",
        SENT: "Émise",
        PENDING: "En attente",
        PARTIALLY_PAID: "Partiellement payée",
        PAID: "Payée",
        OVERDUE: "En retard",
        CANCELLED: "Annulée",
        QUOTE: "Devis",
        ORDER: "Commande",
        INVOICE: "Facture",
        CREDIT_NOTE: "Avoir",
        CASH: "Espèces",
        BANK_TRANSFER: "Virement",
        CHECK: "Chèque",
        MOBILE_MONEY: "Mobile Money",
        CARD: "Carte",
        OTHER: "Autre",
    };
    return translations[status] || status;
}

/**
 * Calculer le pourcentage
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Générer un slug à partir d'un texte
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
