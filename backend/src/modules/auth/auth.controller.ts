import { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env.js";
import {
    AuthenticationRequiredError,
    MissingClientIpError,
} from "../../errors.js";
import { UserRepository } from "../users/users.repository.js";
import { AuthRepository } from "./auth.repository.js";
import {
    deactivateAccountSchema,
    loginSchema,
    passwordChangeSchema,
    registerSchema,
} from "./auth.schemas.js";
import { AuthService } from "./auth.service.js";
import {
    ACCESS_TOKEN_TTL_SECONDS,
    REFRESH_TOKEN_TTL_SECONDS,
} from "./auth.utils.js";

const authService = new AuthService(new UserRepository(), new AuthRepository());

const baseCookie: CookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "prod",
};

const ACCESS_COOKIE_PATH = "/";
const REFRESH_COOKIE_PATH = "/auth";

const setAuthCookies = (
    res: Response,
    accessToken: string,
    refreshToken: string,
) => {
    res.cookie("access_token", accessToken, {
        ...baseCookie,
        path: ACCESS_COOKIE_PATH,
        maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
    });
    res.cookie("refresh_token", refreshToken, {
        ...baseCookie,
        path: REFRESH_COOKIE_PATH,
        maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    });
};

const clearAuthCookies = (res: Response) => {
    res.clearCookie("access_token", {
        ...baseCookie,
        path: ACCESS_COOKIE_PATH,
    });
    res.clearCookie("refresh_token", {
        ...baseCookie,
        path: REFRESH_COOKIE_PATH,
    });
};

const clientIp = (req: Request): string => {
    if (!req.ip) throw new MissingClientIpError();
    return req.ip;
};

const refreshCookie = (req: Request): string | undefined => {
    const value: unknown = req.cookies?.refresh_token;
    return typeof value === "string" ? value : undefined;
};

export const register = async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input, clientIp(req));

    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(201).json({ uuid: result.uuid });
};

export const login = async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input, clientIp(req));

    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json({ uuid: result.uuid });
};

export const refresh = async (req: Request, res: Response) => {
    const token = refreshCookie(req);
    if (!token) throw new AuthenticationRequiredError();

    const result = await authService.rotateRefreshToken(token, clientIp(req));

    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json({ uuid: result.uuid });
};

export const logout = async (req: Request, res: Response) => {
    const token = refreshCookie(req);
    if (token) await authService.logout(token);

    clearAuthCookies(res);
    res.status(204).end();
};

export const changePassword = async (req: Request, res: Response) => {
    const input = passwordChangeSchema.parse(req.body);
    const updatedAt = await authService.changePassword(
        req.auth.uuid,
        input.currentPassword,
        input.newPassword,
    );

    clearAuthCookies(res);
    res.json({ updatedAt });
};

export const deactivateAccount = async (req: Request, res: Response) => {
    const { password } = deactivateAccountSchema.parse(req.body);
    const updatedAt = await authService.deactivateAccount(
        req.auth.uuid,
        password,
    );

    clearAuthCookies(res);
    res.json({ updatedAt });
};
