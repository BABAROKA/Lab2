import argon2 from "argon2";
import { createHash, randomUUID } from "node:crypto";
import { env } from "../../config/env";
import { accessClaimsSchema, refreshClaimsSchema, TokenHash, tokenHashSchema } from "./auth.schemas";
import jwt from "jsonwebtoken";

export const createAccessToken = (uuid: string): string => {
    return jwt.sign({ sub: uuid }, env.JWT_ACCESS_KEY, { expiresIn: "15m" });
}

export const createRefreshToken = (uuid: string): string => {
    return jwt.sign({ sub: uuid, jti: randomUUID() }, env.JWT_REFRESH_KEY, { expiresIn: "30d" });
}

export const verifyAccessToken = (token: string) => {
    const decoded = jwt.verify(token, env.JWT_ACCESS_KEY);

    const result = accessClaimsSchema.safeParse(decoded);
    if (!result.success) throw new Error("Invalid access token claims");

    return result.data;
}

export const verifyRefreshToken = (token: string) => {
    const decoded = jwt.verify(token, env.JWT_REFRESH_KEY);

    const result = refreshClaimsSchema.safeParse(decoded);
    if (!result.success) throw new Error("Invalid refresh token claims");

    return result.data;
}

export const generateTokens = (userUuid: string) => {
    const accessToken = createAccessToken(userUuid);
    const refreshToken = createRefreshToken(userUuid);

    return {
        accessToken,
        refreshToken,
    };
}

export const hashPassword = (password: string): Promise<string> => {
    return argon2.hash(password);
}

export const verifyPassword = (password: string, passwordHash: string): Promise<Boolean> => {
    return argon2.verify(passwordHash, password);
}

export const hashToken = (token: string): TokenHash | null => {
    const hash = createHash("sha256").update(token).digest("base64");
    const result = tokenHashSchema.safeParse(hash);

    if (!result.success) {
        return null;
    }

    return result.data ?? null;
}
