import { z } from "zod";

export const uuidParam = z.uuid();
export const positiveIntParam = z.coerce.number().int().positive();

export const limitSchema = z.coerce.number().int().positive().max(100).default(50);
export const cursorSchema = z.coerce.number().int().positive().optional();

export const listFormatSchema = z.enum(["json", "csv", "xlsx"]).default("json");
