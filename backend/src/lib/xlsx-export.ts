import * as XLSX from "xlsx";

export const toXlsxBuffer = (
    rows: Record<string, unknown>[],
    sheetName = "Sheet1",
): Buffer => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
};

export const fromXlsxBuffer = (buffer: Buffer): Record<string, unknown>[] => {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]!);
};
