import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { db } from "./db/client.js";

const app = express();

app.use(helmet());

app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
    }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
    });
});

app.get("/health/db", async (_req, res) => {
    try {
        await db.execute("SELECT 1");

        res.json({
            status: "ok",
            database: "connected",
        });
    } catch {
        res.status(503).json({
            status: "error",
            database: "disconnected",
        });
    }
});

export { app };
