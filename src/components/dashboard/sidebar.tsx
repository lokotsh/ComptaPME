"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    FileText,
    Users,
    ShoppingCart,
    Building2,
    Landmark,
    ArrowRightLeft,
    Calculator,
    FileSpreadsheet,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronDown,
    Receipt,
    UserCircle,
    Wallet,
    PiggyBank,
    TrendingUp,
    CalendarDays,
    Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
    title: string;
    href?: string;
    icon: React.ElementType;
    items?: NavItem[];
    badge?: string;
    roles?: string[]; // Allowed roles
}

// Configuration de la navigation avec permissions
const getNavigation = (role: string = "CASHIER"): NavItem[] => {
    const allNav: NavItem[] = [
        {
            title: "Tableau de bord",
            href: "/dashboard",
            icon: LayoutDashboard,
            roles: ["ADMIN", "ACCOUNTANT", "HR_MANAGER", "CASHIER", "READ_ONLY"],
        },
        {
            title: "Ventes",
            icon: TrendingUp,
            roles: ["ADMIN", "ACCOUNTANT", "CASHIER", "READ_ONLY"],
            items: [
                { title: "Factures", href: "/dashboard/ventes/factures", icon: FileText },
                { title: "Devis", href: "/dashboard/ventes/devis", icon: FileSpreadsheet },
                { title: "Clients", href: "/dashboard/ventes/clients", icon: Users },
            ],
        },
        {
            title: "Achats",
            icon: ShoppingCart,
            roles: ["ADMIN", "ACCOUNTANT", "READ_ONLY"],
            items: [
                { title: "Factures", href: "/dashboard/achats/factures", icon: Receipt },
                { title: "Fournisseurs", href: "/dashboard/achats/fournisseurs", icon: Building2 },
            ],
        },
        {
            title: "Banque",
            icon: Landmark,
            roles: ["ADMIN", "ACCOUNTANT"],
            items: [
                { title: "Comptes", href: "/dashboard/banque/comptes", icon: Wallet },
                { title: "Import relevés", href: "/dashboard/banque/import", icon: FileSpreadsheet },
                { title: "Rapprochement", href: "/dashboard/banque/rapprochement", icon: ArrowRightLeft },
            ],
        },
        {
            title: "Comptabilité",
            icon: Calculator,
            roles: ["ADMIN", "ACCOUNTANT"],
            items: [
                { title: "Journal", href: "/dashboard/comptabilite/journal", icon: FileText },
                { title: "Plan comptable", href: "/dashboard/comptabilite/plan-comptable", icon: FileSpreadsheet },
            ],
        },
        {
            title: "Paie",
            icon: UserCircle,
            roles: ["ADMIN", "HR_MANAGER", "ACCOUNTANT"],
            items: [
                { title: "Employés", href: "/dashboard/paie/employes", icon: Users },
                { title: "Générer la paie", href: "/dashboard/paie/generer", icon: Calculator },
                { title: "Bulletins", href: "/dashboard/paie/bulletins", icon: FileText },
                { title: "Déclarations", href: "/dashboard/paie/declarations", icon: FileSpreadsheet },
            ],
        },
        {
            title: "Fiscalité",
            icon: PiggyBank,
            roles: ["ADMIN", "ACCOUNTANT"],
            items: [
                { title: "TVA", href: "/dashboard/fiscalite/tva", icon: Receipt },
                { title: "Calendrier", href: "/dashboard/fiscalite/calendrier", icon: CalendarDays },
                { title: "Déclarations", href: "/dashboard/fiscalite/declarations", icon: FileText },
                { title: "Configuration", href: "/dashboard/parametres/fiscalite", icon: Settings },
            ],
        },
        {
            title: "Rapports",
            href: "/dashboard/rapports",
            icon: FileSpreadsheet,
            roles: ["ADMIN", "ACCOUNTANT", "READ_ONLY"],
        },
        {
            title: "Paramètres",
            href: "/dashboard/parametres",
            icon: Settings,
            roles: ["ADMIN"],
        },
    ];

    return allNav.filter(item => !item.roles || item.roles.includes(role));
};

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = React.useState(false);
    const [expandedSections, setExpandedSections] = React.useState<string[]>([]);

    // Default role is CASHIER if not logged in (secure fallback)
    const userRole = session?.user?.role || "CASHIER";
    const navigation = React.useMemo(() => getNavigation(userRole), [userRole]);

    // ... (rest of logic)

    const toggleSection = (title: string) => {
        setExpandedSections((prev) =>
            prev.includes(title)
                ? prev.filter((t) => t !== title)
                : [...prev, title]
        );
    };

    const isActive = (href: string) => pathname === href;
    const isParentActive = (items?: NavItem[]) =>
        items?.some((item) => item.href && pathname.startsWith(item.href));

    React.useEffect(() => {
        // Auto-expand section based on current path
        navigation.forEach((item) => {
            if (item.items && isParentActive(item.items)) {
                setExpandedSections((prev) =>
                    prev.includes(item.title) ? prev : [...prev, item.title]
                );
            }
        });
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <aside
            className={cn(
                "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
                collapsed ? "w-[70px]" : "w-[260px]",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700">
                            <Calculator className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                            ComptaPME
                        </span>
                    </Link>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-8 w-8"
                >
                    {collapsed ? (
                        <Menu className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-1">
                    {navigation.map((item) => (
                        <li key={item.title}>
                            {item.items ? (
                                // Menu avec sous-items
                                <div>
                                    <button
                                        onClick={() => toggleSection(item.title)}
                                        className={cn(
                                            "flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                            isParentActive(item.items)
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        {!collapsed && (
                                            <>
                                                <span className="flex-1 text-left">{item.title}</span>
                                                <ChevronDown
                                                    className={cn(
                                                        "h-4 w-4 transition-transform",
                                                        expandedSections.includes(item.title) && "rotate-180"
                                                    )}
                                                />
                                            </>
                                        )}
                                    </button>
                                    {!collapsed && expandedSections.includes(item.title) && (
                                        <ul className="mt-1 ml-4 space-y-1 border-l-2 border-sidebar-border pl-3">
                                            {item.items.map((subItem) => (
                                                <li key={subItem.title}>
                                                    <Link
                                                        href={subItem.href || "#"}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                                            isActive(subItem.href || "")
                                                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                                                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                                        )}
                                                    >
                                                        <subItem.icon className="h-4 w-4 shrink-0" />
                                                        <span>{subItem.title}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                // Menu simple
                                <Link
                                    href={item.href || "#"}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                        isActive(item.href || "")
                                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    {!collapsed && <span>{item.title}</span>}
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer - User */}
            <div className="border-t border-sidebar-border p-3">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start gap-3",
                        collapsed && "justify-center px-0"
                    )}
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>Déconnexion</span>}
                </Button>
            </div>
        </aside>
    );
}
