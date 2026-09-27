import { db } from "../../db/client.js";
import {
    conversationPermissions,
    ConversationPermissionName,
} from "../../db/schema/conversation_permissions.js";

let cache: Map<ConversationPermissionName, number> | null = null;

export const conversationPermissionIds = async (): Promise<
    Map<ConversationPermissionName, number>
> => {
    if (cache) return cache;
    const rows = await db.select().from(conversationPermissions);
    cache = new Map(rows.map((r) => [r.name, r.id] as const));
    return cache;
};

export const must = <T>(value: T | undefined, what: string): T => {
    if (value === undefined)
        throw new Error(`missing ${what} — did you run npm run db:seed?`);
    return value;
};
