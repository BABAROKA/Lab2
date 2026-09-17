import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { randomUUID } from "node:crypto";
import { accessClaimsSchema, refreshClaimsSchema } from "../modules/auth/auth.schemas.js";

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
