import { sql } from "drizzle-orm";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { db } from "./db/client.js";

import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { devicesRouter } from "./modules/devices/devices.routes.js";
import { conversationsRouter } from "./modules/conversations/conversations.routes.js";
import { invitesRouter } from "./modules/conversations/invites.routes.js";
import { callsRouter } from "./modules/calls/calls.routes.js";
import { filesRouter } from "./modules/files/files.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { blockedUsersRouter } from "./modules/blocked-users/blocked-users.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { rateLimit } from "./middleware/rate-limit.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/health/db", async (_req, res) => {
    try {
        await db.execute(sql`SELECT 1`);
        res.json({ status: "ok", database: "connected" });
    } catch {
        res.status(503).json({ status: "error", database: "disconnected" });
    }
});

app.use(
    "/auth",
    rateLimit({ keyPrefix: "auth", limit: 20, windowSeconds: 60 }),
    authRouter,
);
app.use("/users", usersRouter);
app.use("/devices", devicesRouter);
app.use("/conversations", conversationsRouter);
app.use("/invites", invitesRouter);
app.use("/calls", callsRouter);
app.use("/files", filesRouter);
app.use("/notifications", notificationsRouter);
app.use("/blocked-users", blockedUsersRouter);
app.use("/admin", adminRouter);

app.use(errorHandler);

export { app };
