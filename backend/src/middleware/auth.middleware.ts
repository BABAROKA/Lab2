import { NextFunction, Request, Response } from "express";
import { generateTokens, verifyAccessToken, verifyRefreshToken } from "../utils/jwt";
import { env } from "../config/env.js";

export const access = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const accessToken: string = req.cookies.access_token;
    const refreshToken: string = req.cookies.refresh_token;

    if (!accessToken && !refreshToken) {
        res.status(401).json({
            message: "Authentication required",
        });
        return;
    }

    if (accessToken) {
        try {
            const claims = verifyAccessToken(accessToken);

            req.auth = {
                uuid: claims.sub,
            };
            next();
            return;
        } catch { }
    }

    try {
        const claims = verifyRefreshToken(refreshToken);
        const tokens = generateTokens(claims.sub);

        res.cookie("access_token", tokens.accessToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: env.NODE_ENV === "prod",
        });

        res.cookie("refresh_token", tokens.refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: env.NODE_ENV === "prod",
        });

        req.auth = {
            uuid: claims.sub,
        };
        next();
        return;
    } catch { }

    res.status(401).json({
        message: "Authentication required",
    });
}
