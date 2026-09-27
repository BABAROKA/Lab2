import { z } from "zod";
import { cursorSchema, limitSchema } from "../../schemas/common.js";

const deviceKeyEntrySchema = z.object({
    deviceUuid: z.uuid(),
    encryptedKey: z.string().min(1),
});

const attachmentInputSchema = z.object({
    fileUuid: z.uuid(),
    encryptedMetadata: z.string().min(1),
    deviceKeys: z.array(deviceKeyEntrySchema).min(1),
});

export const sendMessageSchema = z.object({
    ciphertext: z.string().min(1),
    replyToMessageId: z.number().int().positive().optional(),
    mentionUserUuids: z.array(z.uuid()).max(50).default([]),
    deviceKeys: z.array(deviceKeyEntrySchema).min(1),
    attachments: z.array(attachmentInputSchema).max(10).default([]),
});

export const editMessageSchema = z.object({
    ciphertext: z.string().min(1),
});

export const addReactionSchema = z.object({
    reaction: z.string().min(1).max(32),
});

export const markReadSchema = z.object({
    deviceUuid: z.uuid(),
});

export const listMessagesQuerySchema = z.object({
    deviceUuid: z.uuid(),
    limit: limitSchema,
    before: cursorSchema,
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
