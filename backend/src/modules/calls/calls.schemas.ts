import { z } from "zod";
import { callStatusEnum, callTypeEnum } from "../../db/schema/calls.js";
import {
    dateCursorSchema,
    limitSchema,
    listFormatSchema,
} from "../../schemas/common.js";

export const searchCallsQuerySchema = z.object({
    limit: limitSchema,
    before: dateCursorSchema,
    type: z.enum(callTypeEnum.enumValues).optional(),
    status: z.enum(callStatusEnum.enumValues).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    format: listFormatSchema,
});
