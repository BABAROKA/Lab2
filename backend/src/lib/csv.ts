export const toCsv = (rows: Record<string, unknown>[]): string => {
    if (rows.length === 0) return "";

    const headers = Object.keys(rows[0]!);
    const escape = (value: unknown): string => {
        if (value === null || value === undefined) return "";
        const str = value instanceof Date ? value.toISOString() : String(value);
        return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const lines = [headers.join(",")];
    for (const row of rows)
        lines.push(headers.map((h) => escape(row[h])).join(","));
    return lines.join("\n");
};

export const parseCsv = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length === 0) return [];

    const headers = parseCsvLine(lines[0]!);
    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    });
};

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i]!;
        if (inQuotes) {
            if (char === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ",") {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}
