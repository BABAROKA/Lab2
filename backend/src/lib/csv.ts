export const toCsv = (rows: Record<string, unknown>[]): string => {
    if (rows.length === 0) return "";

    const headers = Object.keys(rows[0]!);
    const escape = (value: unknown): string => {
        if (value === null || value === undefined) return "";
        let text = value instanceof Date ? value.toISOString() : String(value);
        if (typeof value === "string" && /^[\u0000-\u0020]*[=+@-]/.test(text))
            text = `'${text}`;
        return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const lines = [headers.map(escape).join(",")];
    for (const row of rows)
        lines.push(headers.map((header) => escape(row[header])).join(","));
    return lines.join("\n");
};

export const parseCsv = (text: string): Record<string, string>[] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i]!;
        if (inQuotes) {
            if (char === '"' && text[i + 1] === '"') {
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
            row.push(current);
            current = "";
        } else if (char === "\n" || char === "\r") {
            row.push(current);
            rows.push(row);
            row = [];
            current = "";
            if (char === "\r" && text[i + 1] === "\n") i++;
        } else {
            current += char;
        }
    }

    if (current.length > 0 || row.length > 0) {
        row.push(current);
        rows.push(row);
    }
    if (rows.length === 0) return [];

    const headers = rows[0]!;
    return rows.slice(1).map((values) =>
        Object.fromEntries(
            headers.map((header, index) => [header, values[index] ?? ""]),
        ),
    );
};
