import { z } from "zod";

export const registerSchema = z.object({
    username: z.string().min(3).max(15),
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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuthResponse = z.infer<typeof responseSchema>;
export type AccessClaims = z.infer<typeof accessClaimsSchema>;
export type RefreshClaims = z.infer<typeof refreshClaimsSchema>;
