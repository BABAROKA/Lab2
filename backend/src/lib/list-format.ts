import { Response } from "express";
import { toCsv } from "./csv.js";
import { toXlsxBuffer } from "./xlsx-export.js";

export type ListFormat = "json" | "csv" | "xlsx";

export const sendList = (
    res: Response,
    filename: string,
    rows: Record<string, unknown>[],
    format: ListFormat,
): void => {
    if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}.csv"`,
        );
        res.send(toCsv(rows));
        return;
    }

    if (format === "xlsx") {
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}.xlsx"`,
        );
        res.send(toXlsxBuffer(rows));
        return;
    }

    res.json(rows);
};
