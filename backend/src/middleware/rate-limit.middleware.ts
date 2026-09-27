import { NextFunction, Request, Response } from "express";
import { RateLimitedError } from "../errors.js";
import { redis } from "../lib/redis.js";

export const rateLimit = (opts: {
    keyPrefix: string;
    limit: number;
    windowSeconds: number;
}) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const key = `ratelimit:${opts.keyPrefix}:${req.ip ?? "unknown"}`;

        const count = await redis.incr(key);
        if (count === 1) await redis.expire(key, opts.windowSeconds);

        if (count > opts.limit) throw new RateLimitedError();

        next();
    };
};
