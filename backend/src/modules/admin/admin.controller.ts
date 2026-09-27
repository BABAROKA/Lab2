import { Request, Response } from "express";
import { z } from "zod";
import {
    auditActionEnum,
    auditEntityEnum,
} from "../../db/schema/audit_logs.js";
import { roleNameEnum } from "../../db/schema/roles.js";
import { parseImportBuffer } from "../../lib/import-parse.js";
import { sendList } from "../../lib/list-format.js";
import {
    cursorSchema,
    dateCursorSchema,
    limitSchema,
    listFormatSchema,
    uuidParam,
} from "../../schemas/common.js";
import { UserRepository } from "../users/users.repository.js";
import { AdminRepository } from "./admin.repository.js";
import { AdminService } from "./admin.service.js";

const adminService = new AdminService(
    new AdminRepository(),
    new UserRepository(),
);

const setRolesSchema = z.object({
    roles: z.array(z.enum(roleNameEnum.enumValues)),
});
const setActiveSchema = z.object({ isActive: z.boolean() });
const upsertSettingSchema = z.object({
    value: z.string().min(1),
    description: z.string().optional(),
});

const searchUsersQuerySchema = z.object({
    limit: limitSchema,
    before: dateCursorSchema,
    search: z.string().trim().min(1).max(100),
    isActive: z.coerce.boolean(),
    format: listFormatSchema,
});

const searchAuditLogsQuerySchema = z.object({
    limit: limitSchema,
    before: cursorSchema,
    action: z.enum(auditActionEnum.enumValues).optional(),
    entity: z.enum(auditEntityEnum.enumValues).optional(),
    userUuid: z.uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    format: listFormatSchema,
});

export const listRoles = async (_req: Request, res: Response) =>
    res.json(await adminService.listRoles());
export const listPermissions = async (_req: Request, res: Response) =>
    res.json(await adminService.listPermissions());

export const listUsers = async (req: Request, res: Response) => {
    const query = searchUsersQuerySchema.parse(req.query);
    const rows = await adminService.searchUsers(query);
    sendList(res, "users", rows, query.format);
};

export const setUserRoles = async (req: Request, res: Response) => {
    const userUuid = uuidParam.parse(req.params.userUuid);
    const { roles } = setRolesSchema.parse(req.body);
    await adminService.setUserRoles(req.auth.id, userUuid, roles);
    res.status(204).end();
};

export const setUserActive = async (req: Request, res: Response) => {
    const userUuid = uuidParam.parse(req.params.userUuid);
    const { isActive } = setActiveSchema.parse(req.body);
    await adminService.setUserActive(req.auth.id, userUuid, isActive);
    res.status(204).end();
};

export const listAuditLogs = async (req: Request, res: Response) => {
    const query = searchAuditLogsQuerySchema.parse(req.query);
    const rows = await adminService.searchAuditLogs(query);
    sendList(res, "audit-logs", rows, query.format);
};

export const listSettings = async (_req: Request, res: Response) =>
    res.json(await adminService.listSettings());

export const updateSetting = async (req: Request, res: Response) => {
    const key = z.string().min(1).parse(req.params.key);
    const input = upsertSettingSchema.parse(req.body);
    res.json(
        await adminService.updateSetting(key, input.value, input.description),
    );
};

export const importUsers = async (req: Request, res: Response) => {
    const format = listFormatSchema.parse(req.query.format ?? "json");

    const rawRows: Record<string, unknown>[] =
        format === "json"
            ? Array.isArray(req.body)
                ? req.body
                : []
            : parseImportBuffer(req.body as Buffer, format);

    res.status(207).json(await adminService.importUsers(req.auth.id, rawRows));
};
