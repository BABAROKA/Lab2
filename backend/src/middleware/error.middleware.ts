import { ErrorRequestHandler } from "express";
import { AppError } from "../errors";
import z from "zod";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            message: err.message,
        });
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

    if (err?.type === "entity.parse.failed") {
        res.status(400).json({ message: "Malformed JSON body" });
        return;
    }

    res.status(500).json({
        message: "Internal server error",
    });
};
