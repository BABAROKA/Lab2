import { NextFunction, Request, Response } from "express";
import { UserRepository } from "../users/users.repository";
import { AuthService } from "./auth.service";
import {
    deactivateAccountSchema,
    loginSchema,
    passwordChangeSchema,
    registerSchema,
} from "./auth.schemas";
import { env } from "../../config/env";
import { AuthRepository } from "./auth.repository";

const authService = new AuthService(new UserRepository(), new AuthRepository());

export const setAuthCookies = (
    res: Response,
    accessToken: string,
    refreshToken: string,
) => {
    res.cookie("access_token", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "prod",
        path: "/",
        maxAge: env.ACCESS_TOKEN_TTL_SECONDS * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "prod",
        path: "/refresh",
        maxAge: env.REFRESH_TOKEN_TTL_SECONDS * 1000,
    });
};

const clearAuthCookies = (res: Response) => {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refreshToken", { path: "/refresh" });
};

export const register = async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);

    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(201).json({
        uuid: result.uuid,
    });
};

export const login = async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);

    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json({
        uuid: result.uuid,
    });
};

export const logout = async (req: Request, res: Response) => {
    await authService.logout(req.cookies.refresh_token);
    clearAuthCookies(res);

    res.status(204).end();
};

export const changePassword = async (req: Request, res: Response) => {
    const input = passwordChangeSchema.parse(req.body);
    const result = await authService.changePassword(
        req.auth.uuid,
        input.currentPassword,
        input.newPassword,
    );

    clearAuthCookies(res);
    res.json({
        updatedAt: result,
    });
};

export const deactivateAccount = async (req: Request, res: Response) => {
    const { password } = deactivateAccountSchema.parse(req.body);
    const result = await authService.deactivateAccount(req.auth.uuid, password);

    res.json({
        updatedAt: result,
    });
};
