import assert from "node:assert/strict";
import test from "node:test";
import { fromXlsxBuffer, toXlsxBuffer } from "../src/lib/xlsx-export.js";
import { toCsv } from "../src/lib/csv.js";

test("XLSX exports can be read back with the original headers and values", () => {
    const rows = [{ name: "Ada", score: 42, enabled: true }];
    assert.deepEqual(fromXlsxBuffer(toXlsxBuffer(rows)), rows);
});

test("CSV emits an empty document for an empty result set", () => {
    assert.equal(toCsv([]), "");
});
