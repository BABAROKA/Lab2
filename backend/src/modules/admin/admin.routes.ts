import { Router } from "express";
import express from "express";
import { access } from "../../middleware/auth.middleware.js";
import { requirePlatformPermission } from "./admin.middleware.js";
import {
    importUsers,
    listAuditLogs,
    listPermissions,
    listRoles,
    listSettings,
    listUsers,
    setUserActive,
    setUserRoles,
    updateSetting,
} from "./admin.controller.js";

const router = Router();
router.use(access);

router.get(
    "/roles",
    requirePlatformPermission("manage_global_roles"),
    listRoles,
);
router.get(
    "/permissions",
    requirePlatformPermission("manage_global_roles"),
    listPermissions,
);

router.get("/users", requirePlatformPermission("manage_users"), listUsers);
router.put(
    "/users/:userUuid/roles",
    requirePlatformPermission("manage_global_roles"),
    setUserRoles,
);
router.patch(
    "/users/:userUuid/status",
    requirePlatformPermission("manage_users"),
    setUserActive,
);

router.post(
    "/users/import",
    requirePlatformPermission("manage_users"),
    express.raw({
        type: [
            "text/csv",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/octet-stream",
        ],
        limit: "10mb",
    }),
    importUsers,
);

router.get(
    "/audit-logs",
    requirePlatformPermission("view_audit_logs"),
    listAuditLogs,
);

router.get(
    "/settings",
    requirePlatformPermission("manage_system_settings"),
    listSettings,
);
router.put(
    "/settings/:key",
    requirePlatformPermission("manage_system_settings"),
    updateSetting,
);

export { router as adminRouter };
