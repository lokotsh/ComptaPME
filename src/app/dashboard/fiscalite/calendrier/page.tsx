"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    AlertTriangle
} from "lucide-react";
import { useSession } from "next-auth/react";
import { fr } from "date-fns/locale";

interface TaxEvent {
    id: string;
    date: Date;
    title: string;
    amount?: number;
    status: 'pending' | 'paid' | 'overdue';
    type: 'tva' | 'cnss' | 'irpp' | 'is' | 'other';
}

export default function TaxCalendarPage() {
    const { data: session } = useSession();
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [events, setEvents] = React.useState<TaxEvent[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchEvents = async () => {
            if (!session?.user?.companyId) return;
            try {
                const res = await fetch(`/api/fiscalite/calendar?companyId=${session.user.companyId}`);
                if (res.ok) {
                    const data = await res.json();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const formattedEvents = data.map((evt: any) => ({
                        ...evt,
                        date: new Date(evt.date)
                    }));
                    setEvents(formattedEvents);
                }
            } catch (error) {
                console.error("Failed to fetch calendar events", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [session]);

    const getDayEvents = (day: Date) => {
        return events.filter(event =>
            event.date.getDate() === day.getDate() &&
            event.date.getMonth() === day.getMonth() &&
            event.date.getFullYear() === day.getFullYear()
        );
    };

    const statusColors = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
        overdue: "bg-red-100 text-red-700 border-red-200"
    };

    const typeLabels = {
        tva: "TVA",
        cnss: "CNSS",
        irpp: "IRPP",
        is: "IS",
        other: "Autre"
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Calendrier Fiscal</h1>
                    <p className="text-muted-foreground">
                        Suivez vos échéances fiscales et sociales
                    </p>
                </div>
                <Button>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Ajouter une échéance
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                {/* Calendar View */}
                <Card className="lg:col-span-5">
                    <CardHeader>
                        <CardTitle>Calendrier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border shadow p-4 w-full max-w-full"
                                locale={fr}
                                modifiers={{
                                    event: (date) => getDayEvents(date).length > 0
                                }}
                                modifiersStyles={{
                                    event: {
                                        fontWeight: 'bold',
                                        textDecoration: 'underline',
                                        color: '#2563eb'
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Events list for selected date or upcoming */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>
                            {date ? date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Prochaines échéances'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {date && getDayEvents(date).length > 0 ? (
                                getDayEvents(date).map(event => (
                                    <div key={event.id} className={`p-4 rounded-lg border ${statusColors[event.status]}`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold">{event.title}</div>
                                                <div className="text-sm mt-1 opacity-90">
                                                    {typeLabels[event.type]}
                                                </div>
                                                {event.amount && (
                                                    <div className="font-bold mt-2">
                                                        {event.amount.toLocaleString('fr-FR')} XOF
                                                    </div>
                                                )}
                                            </div>
                                            {event.status === 'paid' ? (
                                                <CheckCircle2 className="h-5 w-5" />
                                            ) : event.status === 'overdue' ? (
                                                <AlertTriangle className="h-5 w-5" />
                                            ) : (
                                                <Clock className="h-5 w-5" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p>Aucune échéance ce jour</p>
                                </div>
                            )}

                            {/* Show upcoming if nothing selected or empty */}
                            {(!date || getDayEvents(date).length === 0) && events.filter(e => e.status === 'pending').length > 0 && (
                                <div className="mt-8 pt-6 border-t">
                                    <h3 className="font-medium mb-4 text-sm text-muted-foreground">Prochainement</h3>
                                    <div className="space-y-3">
                                        {events.filter(e => e.status === 'pending').slice(0, 3).map(event => (
                                            <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md text-sm">
                                                <div>
                                                    <div className="font-medium">{event.title}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {event.date.toLocaleDateString('fr-FR')}
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={statusColors[event.status].replace('bg-', 'text-')}>
                                                    {event.amount ? `${event.amount.toLocaleString()} XOF` : 'À définir'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
