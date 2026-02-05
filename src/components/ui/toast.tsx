"use client";

import * as React from "react";
import { useToastStore } from "@/stores";
import { X, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
};

const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200",
    warning: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-200",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200",
};

const iconStyles = {
    success: "text-emerald-600 dark:text-emerald-400",
    error: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-blue-600 dark:text-blue-400",
};

export function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
            {toasts.map((toast) => {
                const Icon = icons[toast.type];

                return (
                    <div
                        key={toast.id}
                        className={cn(
                            "flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full duration-300",
                            styles[toast.type]
                        )}
                    >
                        <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconStyles[toast.type])} />
                        <p className="flex-1 text-sm font-medium">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="shrink-0 rounded-full p-1 hover:bg-black/10 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

// Hook pour utiliser facilement les toasts
export function useToast() {
    const { addToast } = useToastStore();

    return {
        success: (message: string) => addToast({ type: "success", message }),
        error: (message: string) => addToast({ type: "error", message }),
        warning: (message: string) => addToast({ type: "warning", message }),
        info: (message: string) => addToast({ type: "info", message }),
    };
}
