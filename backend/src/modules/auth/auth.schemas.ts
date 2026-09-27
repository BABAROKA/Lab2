import { z } from "zod";

const emailSchema = z.email().transform((email) => email.toLowerCase());
const newPasswordSchema = z.string().min(8).max(128);

export const registerSchema = z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100).nullable().default(null),
    email: emailSchema,
    password: newPasswordSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1).max(128),
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
});

export const refreshClaimsSchema = z.object({
    sub: z.uuid(),
    iat: z.number(),
    exp: z.number(),
    jti: z.uuid(),
});

export const tokenHashSchema = z.hash("sha256", { enc: "base64" });

export const ipAddressSchema = z.union([z.ipv4(), z.ipv6()]);

export const refreshTokenSchema = z.object({
    id: z.number(),
    userId: z.number(),
    tokenHash: tokenHashSchema,
    ipAddress: ipAddressSchema,
    expiresAt: z.date(),
    revokedAt: z.date().nullable(),
    createdAt: z.date(),
});

export const newRefreshTokenSchema = z.object({
    userId: z.number(),
    tokenHash: tokenHashSchema,
    ipAddress: ipAddressSchema,
    expiresAt: z.date(),
});

export const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: newPasswordSchema,
});

export const deactivateAccountSchema = z.object({
    password: z.string().min(1).max(128),
});

export type DeactivateAccount = z.infer<typeof deactivateAccountSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuthResponse = z.infer<typeof responseSchema>;
export type AccessClaims = z.infer<typeof accessClaimsSchema>;
export type RefreshClaims = z.infer<typeof refreshClaimsSchema>;
export type RefreshToken = z.infer<typeof refreshTokenSchema>;
export type NewRefreshToken = z.infer<typeof newRefreshTokenSchema>;
export type TokenHash = z.infer<typeof tokenHashSchema>;
export type IpAddress = z.infer<typeof ipAddressSchema>;
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
