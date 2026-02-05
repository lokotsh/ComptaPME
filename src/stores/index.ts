import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string;
    companyName: string;
}

interface Company {
    id: string;
    name: string;
    currency: string;
    fiscalYearStart: number;
}

interface AuthState {
    user: User | null;
    company: Company | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setCompany: (company: Company | null) => void;
    login: (user: User, company: Company) => void;
    logout: () => void;
}

// Store d'authentification
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            company: null,
            isAuthenticated: false,
            isLoading: true,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setCompany: (company) => set({ company }),
            login: (user, company) =>
                set({ user, company, isAuthenticated: true, isLoading: false }),
            logout: () =>
                set({ user: null, company: null, isAuthenticated: false }),
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                company: state.company,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// Types pour les factures
interface InvoiceLine {
    id?: string;
    description: string;
    quantity: number;
    unitPriceHT: number;
    tvaRate: number;
    discountPercent: number;
    totalHT?: number;
    totalTVA?: number;
    totalTTC?: number;
}

interface InvoiceDraft {
    clientId: string;
    type: "QUOTE" | "ORDER" | "INVOICE" | "CREDIT_NOTE";
    issueDate: string;
    dueDate: string;
    notes: string;
    lines: InvoiceLine[];
}

interface InvoiceState {
    draft: InvoiceDraft;
    isDirty: boolean;
    setDraft: (draft: Partial<InvoiceDraft>) => void;
    setLines: (lines: InvoiceLine[]) => void;
    addLine: () => void;
    updateLine: (index: number, line: Partial<InvoiceLine>) => void;
    removeLine: (index: number) => void;
    reset: () => void;
    calculateTotals: () => { totalHT: number; totalTVA: number; totalTTC: number };
}

const defaultLine: InvoiceLine = {
    description: "",
    quantity: 1,
    unitPriceHT: 0,
    tvaRate: 18,
    discountPercent: 0,
};

const defaultDraft: InvoiceDraft = {
    clientId: "",
    type: "INVOICE",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    notes: "",
    lines: [{ ...defaultLine }],
};

// Store pour la création/édition de facture
export const useInvoiceStore = create<InvoiceState>()((set, get) => ({
    draft: { ...defaultDraft },
    isDirty: false,

    setDraft: (draft) =>
        set((state) => ({
            draft: { ...state.draft, ...draft },
            isDirty: true,
        })),

    setLines: (lines) =>
        set((state) => ({
            draft: { ...state.draft, lines },
            isDirty: true,
        })),

    addLine: () =>
        set((state) => ({
            draft: {
                ...state.draft,
                lines: [...state.draft.lines, { ...defaultLine }],
            },
            isDirty: true,
        })),

    updateLine: (index, line) =>
        set((state) => ({
            draft: {
                ...state.draft,
                lines: state.draft.lines.map((l, i) =>
                    i === index ? { ...l, ...line } : l
                ),
            },
            isDirty: true,
        })),

    removeLine: (index) =>
        set((state) => ({
            draft: {
                ...state.draft,
                lines: state.draft.lines.filter((_, i) => i !== index),
            },
            isDirty: true,
        })),

    reset: () =>
        set({
            draft: { ...defaultDraft, lines: [{ ...defaultLine }] },
            isDirty: false,
        }),

    calculateTotals: () => {
        const { lines } = get().draft;
        let totalHT = 0;
        let totalTVA = 0;
        let totalTTC = 0;

        lines.forEach((line) => {
            const baseHT = line.quantity * line.unitPriceHT;
            const discount = baseHT * (line.discountPercent / 100);
            const lineHT = baseHT - discount;
            const lineTVA = lineHT * (line.tvaRate / 100);

            totalHT += lineHT;
            totalTVA += lineTVA;
            totalTTC += lineHT + lineTVA;
        });

        return { totalHT, totalTVA, totalTTC };
    },
}));

// Types pour les filtres
interface InvoiceFilters {
    search: string;
    status: string;
    type: string;
    clientId: string;
    dateFrom: string;
    dateTo: string;
    page: number;
    limit: number;
}

interface FiltersState {
    invoiceFilters: InvoiceFilters;
    clientFilters: {
        search: string;
        isActive: string;
        page: number;
        limit: number;
    };
    setInvoiceFilters: (filters: Partial<InvoiceFilters>) => void;
    setClientFilters: (filters: Partial<FiltersState["clientFilters"]>) => void;
    resetInvoiceFilters: () => void;
    resetClientFilters: () => void;
}

const defaultInvoiceFilters: InvoiceFilters = {
    search: "",
    status: "",
    type: "",
    clientId: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    limit: 20,
};

const defaultClientFilters = {
    search: "",
    isActive: "",
    page: 1,
    limit: 20,
};

// Store pour les filtres
export const useFiltersStore = create<FiltersState>()((set) => ({
    invoiceFilters: { ...defaultInvoiceFilters },
    clientFilters: { ...defaultClientFilters },

    setInvoiceFilters: (filters) =>
        set((state) => ({
            invoiceFilters: { ...state.invoiceFilters, ...filters },
        })),

    setClientFilters: (filters) =>
        set((state) => ({
            clientFilters: { ...state.clientFilters, ...filters },
        })),

    resetInvoiceFilters: () =>
        set({ invoiceFilters: { ...defaultInvoiceFilters } }),

    resetClientFilters: () =>
        set({ clientFilters: { ...defaultClientFilters } }),
}));

// Store pour les notifications/toasts
interface Toast {
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
    duration?: number;
}

interface ToastState {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;
}

export const useToastStore = create<ToastState>()((set) => ({
    toasts: [],

    addToast: (toast) => {
        const id = Date.now().toString();
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }));

        // Auto-remove after duration
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, duration);
        }
    },

    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),

    clearToasts: () => set({ toasts: [] }),
}));
