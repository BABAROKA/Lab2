import { NextFunction, Request, Response } from "express";
import { UserRepository } from "../users/users.repository";
import { AuthService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.schemas";
import { env } from "../../config/env";

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const input = registerSchema.parse(req.body);
        const result = await authService.register(input);

        setAuthCookies(res, result.accessToken, result.refreshToken)

        return res.status(201).json({
            uuid: result.uuid,
        });
    } catch (e) {
        next(e)
    }
}

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const input = loginSchema.parse(req.body);
        const result = await authService.login(input);

        setAuthCookies(res, result.accessToken, result.refreshToken)

        return res.json({
            uuid: result.uuid,
        });
    } catch (e) {
        next(e);
    }
}

export const setAuthCookies = (
    res: Response,
    accessToken: string,
    refreshToken: string,
) => {
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
}
