import { db } from "../db/client.js";
import {
    auditActionEnum,
    auditEntityEnum,
    auditLogs,
} from "../db/schema/audit_logs.js";

type AuditAction = (typeof auditActionEnum.enumValues)[number];
type AuditEntity = (typeof auditEntityEnum.enumValues)[number];

export const recordAudit = async (entry: {
    userId: number | null;
    action: AuditAction;
    entity: AuditEntity;
    entityId?: number;
    oldValue?: unknown;
    newValue?: unknown;
    ipAddress?: string;
}): Promise<void> => {
    try {
        await db.insert(auditLogs).values({
            userId: entry.userId,
            action: entry.action,
            entity: entry.entity,
            entityId: entry.entityId ?? null,
            oldValue: entry.oldValue ?? null,
            newValue: entry.newValue ?? null,
            ipAddress: entry.ipAddress ?? null,
        });
    } catch (err) {
        console.error("Failed to write audit log:", err);
    }
};
