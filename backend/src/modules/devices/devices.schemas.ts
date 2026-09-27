import { z } from "zod";
import { devicePlatformEnum } from "../../db/schema/devices.js";

const oneTimePrekeySchema = z.object({
    keyId: z.number().int().nonnegative(),
    publicKey: z.string().min(1),
});

export const registerDeviceSchema = z.object({
    name: z.string().trim().min(1).max(100),
    platform: z.enum(devicePlatformEnum.enumValues),
    identityPublicKey: z.string().min(1),
    signedPrekey: z.object({
        keyId: z.number().int().nonnegative(),
        publicKey: z.string().min(1),
        signature: z.string().min(1),
    }),
    oneTimePrekeys: z.array(oneTimePrekeySchema).min(1).max(200),
});

export const topUpPrekeysSchema = z.object({
    oneTimePrekeys: z.array(oneTimePrekeySchema).min(1).max(200),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type TopUpPrekeysInput = z.infer<typeof topUpPrekeysSchema>;
