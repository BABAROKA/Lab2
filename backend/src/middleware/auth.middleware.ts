import { NextFunction, Request, Response } from "express";
import { AuthenticationRequiredError } from "../errors.js";
import { verifyAccessToken } from "../modules/auth/auth.utils.js";
import { UserRepository } from "../modules/users/users.repository.js";

const userRepository = new UserRepository();

export const access = async (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    const token: unknown = req.cookies?.access_token;
    if (typeof token !== "string") throw new AuthenticationRequiredError();

    const claims = verifyAccessToken(token);

    const user = await userRepository.findByUuid(claims.sub);
    if (!user || !user.isActive) throw new AuthenticationRequiredError();

    req.auth = { id: user.id, uuid: user.uuid };
    next();
};
