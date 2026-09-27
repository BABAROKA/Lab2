import argon2 from "argon2";
import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
    AccessClaims,
    accessClaimsSchema,
    RefreshClaims,
    refreshClaimsSchema,
    TokenHash,
    tokenHashSchema,
} from "./auth.schemas.js";
import {
    InvalidAccessTokenClaimsError,
    InvalidRefreshTokenClaimsError,
} from "../../errors.js";

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export const refreshTokenExpiry = (): Date =>
    new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

export const createAccessToken = (uuid: string): string =>
    jwt.sign({ sub: uuid }, env.JWT_ACCESS_KEY, {
        algorithm: "HS256",
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });

export const createRefreshToken = (uuid: string): string =>
    jwt.sign({ sub: uuid, jti: randomUUID() }, env.JWT_REFRESH_KEY, {
        algorithm: "HS256",
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    });

/** @throws */
export const verifyAccessToken = (token: string): AccessClaims => {
    const decoded = jwt.verify(token, env.JWT_ACCESS_KEY, {
        algorithms: ["HS256"],
    });
    const result = accessClaimsSchema.safeParse(decoded);
    if (!result.success) throw new InvalidAccessTokenClaimsError();
    return result.data;
};

/** @throws */
export const verifyRefreshToken = (token: string): RefreshClaims => {
    const decoded = jwt.verify(token, env.JWT_REFRESH_KEY, {
        algorithms: ["HS256"],
    });
    const result = refreshClaimsSchema.safeParse(decoded);
    if (!result.success) throw new InvalidRefreshTokenClaimsError();
    return result.data;
};

export const generateTokens = (uuid: string) => ({
    accessToken: createAccessToken(uuid),
    refreshToken: createRefreshToken(uuid),
});

export const hashPassword = (password: string): Promise<string> =>
    argon2.hash(password);

export const verifyPassword = (
    password: string,
    passwordHash: string,
): Promise<boolean> => argon2.verify(passwordHash, password);

export const hashToken = (token: string): TokenHash =>
    tokenHashSchema.parse(createHash("sha256").update(token).digest("base64"));
