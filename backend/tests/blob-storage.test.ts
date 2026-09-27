import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { LocalDiskStorage } from "../src/lib/blob-storage.js";

test("local blob storage writes, reads, hashes, and deletes data", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "backend-blob-test-"));
    try {
        const storage = new LocalDiskStorage(root);
        const input = Buffer.from("private attachment bytes");
        const saved = await storage.put(input);

        assert.equal(saved.sizeBytes, input.length);
        assert.equal(saved.sha256, createHash("sha256").update(input).digest("hex"));
        assert.deepEqual(await storage.get(saved.storageKey), input);
        await storage.delete(saved.storageKey);
        await assert.rejects(storage.get(saved.storageKey));
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
