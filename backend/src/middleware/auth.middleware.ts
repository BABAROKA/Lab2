import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../modules/auth/auth.utils";
import { env } from "../config/env.js";
import { AuthService } from "../modules/auth/auth.service";
import { UserRepository } from "../modules/users/users.repository";
import { AuthRepository } from "../modules/auth/auth.repository";
import { AuthenticationRequiredError } from "../errors";

const authService = new AuthService(new UserRepository(), new AuthRepository());

export const access = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const cookieAccessToken: string = req.cookies.access_token;
    const cookieRefreshToken: string = req.cookies.refresh_token;

    if (!cookieAccessToken && !cookieRefreshToken) {
        throw new AuthenticationRequiredError();
    }

    try {
        const claims = verifyAccessToken(cookieAccessToken);
        req.auth = {
            uuid: claims.sub,
        };
        next();
        return;
    } catch { }

    const ipAddrees = req.ip;
    if (!ipAddrees) {
        throw new AuthenticationRequiredError();
    }

    const { uuid, accessToken, refreshToken } =
        await authService.rotateRefreshToken(cookieRefreshToken, ipAddrees);

    res.cookie("access_token", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "prod",
    });

    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "prod",
    });

    req.auth = { uuid };
    next();
};
