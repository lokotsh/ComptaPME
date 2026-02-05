"use client";

import * as React from "react";
import { Bell, Search, User, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface HeaderProps {
    companyName?: string;
    userName?: string;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    createdAt: string;
    isRead: boolean;
}

export function Header({ companyName = "Ma Société" }: HeaderProps) {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [isOpen, setIsOpen] = React.useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.length); // Assuming endpoint returns only unread or we filter? The endpoint returns unread.
            }
        } catch {
            console.error("Failed to fetch notifications");
        }
    };

    React.useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async () => {
        if (unreadCount === 0) return;

        const ids = notifications.map(n => n.id);
        try {
            await fetch("/api/notifications", {
                method: "POST",
                body: JSON.stringify({ ids }),
            });
            setUnreadCount(0);
            // Optionally clear list or keep them as read
            // For now, simple behavior: just reset count badge
        } catch {
            console.error("Failed to mark read");
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            markAsRead();
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'WARNING': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'SUCCESS': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'ERROR': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Rechercher..."
                        className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                    />
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4">
                {/* Company name */}
                <div className="hidden md:block text-right">
                    <p className="text-sm font-medium">{companyName}</p>
                    <p className="text-xs text-muted-foreground">Exercice 2026</p>
                </div>

                {/* Separator */}
                <div className="hidden md:block h-8 w-px bg-border" />

                {/* Notifications */}
                <Popover open={isOpen} onOpenChange={handleOpenChange}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-white text-[10px]">
                                    {unreadCount}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-4 border-b">
                            <h4 className="font-semibold leading-none">Notifications</h4>
                            <p className="text-xs text-muted-foreground mt-1">Vous avez {unreadCount} messages non lus</p>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    Aucune notification
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {notifications.map((notif) => (
                                        <div key={notif.id} className="p-4 hover:bg-muted/50 transition-colors flex gap-3 text-sm">
                                            <div className="mt-0.5">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="font-medium leading-none">{notif.title}</p>
                                                <p className="text-muted-foreground text-xs leading-relaxed">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground pt-1">
                                                    {format(new Date(notif.createdAt), "d MMM HH:mm", { locale: fr })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* User menu */}
                <Button variant="ghost" size="icon" className="rounded-full border-2 border-transparent hover:border-primary/20">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                        <User className="h-4 w-4 text-white" />
                    </div>
                </Button>
            </div>
        </header>
    );
}
