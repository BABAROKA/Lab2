import { parseCsv } from "./csv.js";
import { fromXlsxBuffer } from "./xlsx-export.js";

export const parseImportBuffer = (
    buffer: Buffer,
    format: "csv" | "xlsx",
): Record<string, unknown>[] =>
    format === "xlsx"
        ? fromXlsxBuffer(buffer)
        : parseCsv(buffer.toString("utf-8"));
