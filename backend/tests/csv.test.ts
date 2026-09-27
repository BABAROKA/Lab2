import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv, toCsv } from "../src/lib/csv.js";

test("parseCsv reads quoted commas, escaped quotes, and embedded newlines", () => {
    const csv = 'name,note\r\n"Doe, Jane","said ""hello""\nand left"\r\n';
    assert.deepEqual(parseCsv(csv), [
        { name: "Doe, Jane", note: 'said "hello"\nand left' },
    ]);
});

test("parseCsv handles empty input, CRLF, and missing trailing cells", () => {
    assert.deepEqual(parseCsv(""), []);
    assert.deepEqual(parseCsv("a,b\r\n1\r\n"), [{ a: "1", b: "" }]);
});

test("toCsv escapes headers and values and neutralizes formula-like strings", () => {
    assert.equal(
        toCsv([
            { 'na,me': "=SUM(1,2)", note: 'say "hi"\nnext', number: -12 },
        ]),
        '"na,me",note,number\n"\'=SUM(1,2)","say ""hi""\nnext",-12',
    );
});

test("CSV serialization round-trips ordinary structured values", () => {
    const rows = [{ first: "Ada", last: "Lovelace", empty: "" }];
    assert.deepEqual(parseCsv(toCsv(rows)), rows);
});
