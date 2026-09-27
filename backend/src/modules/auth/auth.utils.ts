import argon2 from "argon2";
import { createHash, randomUUID } from "node:crypto";
import { env } from "../../config/env";
import {
    AccessClaims,
    accessClaimsSchema,
    RefreshClaims,
    refreshClaimsSchema,
    TokenHash,
    tokenHashSchema,
} from "./auth.schemas";
import jwt from "jsonwebtoken";
import {
    InvalidAccessTokenClaimsError,
    InvalidRefreshTokenClaimsError,
} from "../../errors";

export const refreshTokenExpiry = (): Date =>
    new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);

export const createAccessToken = (uuid: string): string => {
    return jwt.sign({ sub: uuid }, env.JWT_ACCESS_KEY, {
        expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
        algorithm: "HS256",
    });
};

export const createRefreshToken = (uuid: string): string => {
    return jwt.sign({ sub: uuid, jti: randomUUID() }, env.JWT_REFRESH_KEY, {
        expiresIn: env.REFRESH_TOKEN_TTL_SECONDS,
        algorithm: "HS256",
    });
};

/**
 * @throws
 */
export const verifyAccessToken = (token: string): AccessClaims => {
    const decoded = jwt.verify(token, env.JWT_ACCESS_KEY, {
        algorithms: ["HS256"],
    });

    const result = accessClaimsSchema.parse(decoded);
    return result;
};

/**
 * @throws
 */
export const verifyRefreshToken = (token: string): RefreshClaims => {
    const decoded = jwt.verify(token, env.JWT_REFRESH_KEY, {
        algorithms: ["HS256"],
    });

    const result = refreshClaimsSchema.parse(decoded);
    return result;
};

export const generateTokens = (userUuid: string) => ({
    accessToken: createAccessToken(userUuid),
    refreshToken: createRefreshToken(userUuid),
});

export const hashPassword = async (password: string): Promise<string> => {
    return await argon2.hash(password);
};

export const verifyPassword = async (
    password: string,
    passwordHash: string,
): Promise<Boolean> => {
    return await argon2.verify(passwordHash, password);
};

export const hashToken = (token: string): TokenHash =>
    tokenHashSchema.parse(createHash("sha256").update(token).digest("base64"));
