import { z } from "zod";

export const registerSchema = z.object({
    firstName: z.string(),
    lastName: z.string().nullable(),
    email: z.email(),
    password: z.string().min(8),
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
});

export const responseSchema = z.object({
    uuid: z.uuid(),
    accessToken: z.string(),
    refreshToken: z.string(),
});

export const accessClaimsSchema = z.object({
    sub: z.uuid(),
    iat: z.number(),
    exp: z.number(),
})

export const refreshClaimsSchema = z.object({
    sub: z.uuid(),
    iat: z.number(),
    exp: z.number(),
    jti: z.uuid(),
})

export const tokenHashSchema = z.hash("sha256", { enc: "base64" });

export const refreshTokenSchema = z.object({
    id: z.number(),
    userId: z.number(),
    tokenHash: tokenHashSchema,
    deviceName: z.string(),
    userAgent: z.string().nullable(),
    expiresAt: z.date(),
    revokedAt: z.date().nullable(),
    createdAt: z.date(),
})

export const newRefreshTokenSchema = z.object({
    userId: z.number(),
    tokenHash: tokenHashSchema,
    deviceName: z.string(),
    userAgent: z.string().nullable().optional(),
    expiresAt: z.date(),
})

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuthResponse = z.infer<typeof responseSchema>;
export type AccessClaims = z.infer<typeof accessClaimsSchema>;
export type RefreshClaims = z.infer<typeof refreshClaimsSchema>;
export type RefreshToken = z.infer<typeof refreshTokenSchema>;
export type NewRefreshToken = z.infer<typeof newRefreshTokenSchema>;
export type TokenHash = z.infer<typeof tokenHashSchema>;
