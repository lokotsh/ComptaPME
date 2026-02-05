"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Clock,
    AlertTriangle,
    Bell,
    FileText,
    CreditCard,
    Building2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

// Données simulées - Échéances
const deadlines = [
    {
        id: "1",
        title: "Déclaration TVA Janvier",
        type: "tax",
        dueDate: "2026-02-20",
        status: "upcoming",
        amount: 760500,
        description: "TVA à payer pour la période de janvier 2026",
    },
    {
        id: "2",
        title: "CNSS Janvier",
        type: "social",
        dueDate: "2026-02-15",
        status: "upcoming",
        amount: 452000,
        description: "Cotisations CNSS (part salariale + patronale)",
    },
    {
        id: "3",
        title: "Facture SOBEMAP",
        type: "supplier",
        dueDate: "2026-02-14",
        status: "upcoming",
        amount: 2450000,
        description: "Facture fournisseur SOBEMAP-2026-0145",
    },
    {
        id: "4",
        title: "ITS Janvier",
        type: "tax",
        dueDate: "2026-02-10",
        status: "urgent",
        amount: 185000,
        description: "Impôt sur traitements et salaires",
    },
    {
        id: "5",
        title: "Loyer mensuel",
        type: "expense",
        dueDate: "2026-02-01",
        status: "urgent",
        amount: 300000,
        description: "Loyer bureau Akpakpa",
    },
    {
        id: "6",
        title: "Déclaration TVA Décembre",
        type: "tax",
        dueDate: "2026-01-20",
        status: "completed",
        amount: 730000,
        description: "TVA payée pour la période de décembre 2025",
    },
    {
        id: "7",
        title: "CNSS Décembre",
        type: "social",
        dueDate: "2026-01-15",
        status: "completed",
        amount: 438000,
        description: "Cotisations CNSS payées",
    },
];

const typeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    tax: { label: "Fiscalité", icon: Building2, color: "bg-red-100 text-red-600" },
    social: { label: "Social", icon: CreditCard, color: "bg-blue-100 text-blue-600" },
    supplier: { label: "Fournisseur", icon: FileText, color: "bg-violet-100 text-violet-600" },
    expense: { label: "Charge", icon: CreditCard, color: "bg-amber-100 text-amber-600" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
    urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
    upcoming: { label: "À venir", color: "bg-amber-100 text-amber-700" },
    completed: { label: "Payé", color: "bg-emerald-100 text-emerald-700" },
};

// Générer les jours du calendrier
const generateCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay() || 7; // Convert Sunday (0) to 7

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = startDayOfWeek - 1; i > 0; i--) {
        const date = new Date(year, month, 1 - i);
        days.push({ date, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month days to complete the grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = React.useState(new Date(2026, 0)); // January 2026
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

    const calendarDays = generateCalendarDays(currentDate.getFullYear(), currentDate.getMonth());
    const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split("T")[0];
    };

    const getDeadlinesForDate = (date: Date) => {
        const dateStr = formatDate(date);
        return deadlines.filter((d) => d.dueDate === dateStr);
    };

    const upcomingDeadlines = deadlines
        .filter((d) => d.status !== "completed")
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const urgentCount = deadlines.filter((d) => d.status === "urgent").length;
    const upcomingCount = deadlines.filter((d) => d.status === "upcoming").length;
    const totalAmount = upcomingDeadlines.reduce((sum, d) => sum + d.amount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Calendrier des échéances</h1>
                    <p className="text-muted-foreground">
                        Gérez vos obligations fiscales et paiements
                    </p>
                </div>
                <Button variant="outline">
                    <Bell className="mr-2 h-4 w-4" />
                    Configurer les rappels
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-red-200/50 bg-red-50/30 dark:bg-red-950/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Urgentes</p>
                                <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
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
                                <p className="text-sm text-muted-foreground">À venir (30j)</p>
                                <p className="text-2xl font-bold">{upcomingCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-primary/20">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total à décaisser</p>
                        <p className="text-2xl font-bold text-primary">{totalAmount.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">XOF</span></p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Calendar */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">
                            {currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                        </CardTitle>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={prevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={nextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Week days header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekDays.map((day) => (
                                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, index) => {
                                const dayDeadlines = getDeadlinesForDate(day.date);
                                const hasUrgent = dayDeadlines.some((d) => d.status === "urgent");
                                const hasUpcoming = dayDeadlines.some((d) => d.status === "upcoming");
                                const isToday = formatDate(day.date) === formatDate(new Date(2026, 0, 18)); // Simulated today

                                return (
                                    <div
                                        key={index}
                                        onClick={() => setSelectedDate(day.date)}
                                        className={`relative aspect-square p-1 rounded-lg cursor-pointer transition-colors ${day.isCurrentMonth ? "" : "opacity-30"
                                            } ${selectedDate && formatDate(selectedDate) === formatDate(day.date)
                                                ? "bg-primary text-white"
                                                : isToday
                                                    ? "bg-primary/10 border-2 border-primary"
                                                    : "hover:bg-muted"
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{day.date.getDate()}</span>
                                        {dayDeadlines.length > 0 && (
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                {hasUrgent && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                                {hasUpcoming && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span>Urgent</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <span>À venir</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>Payé</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Deadlines */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Prochaines échéances</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {upcomingDeadlines.slice(0, 5).map((deadline) => {
                                const TypeIcon = typeConfig[deadline.type].icon;
                                return (
                                    <div
                                        key={deadline.id}
                                        className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${typeConfig[deadline.type].color}`}>
                                                <TypeIcon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-sm truncate">{deadline.title}</p>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusConfig[deadline.status].color}`}>
                                                        {statusConfig[deadline.status].label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(deadline.dueDate).toLocaleDateString("fr-FR", {
                                                        day: "2-digit",
                                                        month: "short",
                                                    })}
                                                </p>
                                                <p className="font-semibold text-sm mt-1">
                                                    {deadline.amount.toLocaleString("fr-FR")} XOF
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
