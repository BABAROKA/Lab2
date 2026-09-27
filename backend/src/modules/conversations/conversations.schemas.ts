import { z } from "zod";
import { conversationRoleNameEnum } from "../../db/schema/conversation_roles.js";
import {
    dateCursorSchema,
    limitSchema,
    listFormatSchema,
} from "../../schemas/common.js";

export const createDirectConversationSchema = z.object({
    type: z.literal("direct"),
    peerUuid: z.uuid(),
});

export const createGroupConversationSchema = z.object({
    type: z.literal("group"),
    name: z.string().trim().min(1).max(100),
});

export const createConversationSchema = z.discriminatedUnion("type", [
    createDirectConversationSchema,
    createGroupConversationSchema,
]);

export const updateConversationSchema = z.strictObject({
    name: z.string().trim().min(1).max(100),
});

export const updateSettingsSchema = z
    .strictObject({
        disappearingMessages: z.boolean(),
        disappearingMessagesSeconds: z.number().int().positive().nullable(),
    })
    .refine(
        (v) =>
            !v.disappearingMessages || v.disappearingMessagesSeconds !== null,
        {
            message:
                "disappearingMessagesSeconds is required when disappearingMessages is true",
        },
    );

export const assignRoleSchema = z.object({
    role: z.enum(conversationRoleNameEnum.enumValues),
});

export const createInviteSchema = z.object({
    inviteeUuid: z.uuid(),
    expiresInHours: z
        .number()
        .int()
        .positive()
        .max(24 * 30)
        .default(72),
});

export const listConversationsQuerySchema = z.object({
    limit: limitSchema,
    before: dateCursorSchema,
    search: z.string().trim().min(1).max(100).optional(),
    type: z.enum(["direct", "group"]).optional(),
    sort: z.enum(["recent", "name"]).default("recent"),
    format: listFormatSchema,
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
