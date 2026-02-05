import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'PAYMENT';
export type EntityType = 'INVOICE' | 'QUOTE' | 'CLIENT' | 'SUPPLIER' | 'PAYMENT' | 'EMPLOYEE' | 'SETTINGS' | 'BANK_TRANSACTION' | 'PAYROLL_RUN';

interface AuditLogParams {
    action: AuditAction;
    entityType: EntityType;
    entityId?: string;
    details?: unknown; // Will be stored in newValues or oldValues depending on context
    oldDetails?: unknown;
}

export async function logAudit(params: AuditLogParams) {
    try {
        const session = await getServerSession(authOptions);

        // Even if no session (system action), we might want to log if companyId context is known.
        // But for now, we rely on session for companyId and userId.
        if (!session?.user?.companyId) {
            console.warn("Audit log skipped: No session/companyId");
            return;
        }

        await prisma.auditLog.create({
            data: {
                companyId: session.user.companyId,
                userId: session.user.id,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                oldValues: params.oldDetails ? JSON.stringify(params.oldDetails) : undefined,
                newValues: params.details ? JSON.stringify(params.details) : undefined,
                ipAddress: "0.0.0.0", // Hard to get in server action helper without request object, could be passed
                userAgent: "System",
            }
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // We don't throw to avoid blocking the main action
    }
}
