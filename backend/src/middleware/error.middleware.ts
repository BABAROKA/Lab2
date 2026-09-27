import { ErrorRequestHandler } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { AppError } from "../errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ message: err.message });
        return;
    }

    if (err instanceof z.ZodError) {
        res.status(400).json({
            message: "Validation failed",
            issues: err.issues.map((issue) => ({
                path: issue.path.map(String).join("."),
                message: issue.message,
            })),
        });
        return;
    }

    if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
    }

    if (err?.type === "entity.parse.failed") {
        res.status(400).json({ message: "Malformed JSON body" });
        return;
    }

    console.error(err);
    res.status(500).json({ message: "Internal server error" });
};
