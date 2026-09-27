import { NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { ForbiddenError } from "../../errors.js";
import { userRoles } from "../../db/schema/user_roles.js";
import { roles } from "../../db/schema/roles.js";
import { rolePermissions } from "../../db/schema/role_permissions.js";
import { permissions, PermissionName } from "../../db/schema/permissions.js";

export const requirePlatformPermission = (permission: PermissionName) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const [row] = await db
            .select({ id: permissions.id })
            .from(userRoles)
            .innerJoin(roles, eq(roles.id, userRoles.roleId))
            .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
            .innerJoin(
                permissions,
                and(
                    eq(permissions.id, rolePermissions.permissionId),
                    eq(permissions.name, permission),
                ),
            )
            .where(eq(userRoles.userId, req.auth.id))
            .limit(1);

        if (!row) throw new ForbiddenError();
        next();
    };
};
