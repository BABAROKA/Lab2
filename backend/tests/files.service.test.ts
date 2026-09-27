import assert from "node:assert/strict";
import test from "node:test";
import { FileTooLargeError } from "../src/errors.js";
import { env } from "../src/config/env.js";
import { FilesService } from "../src/modules/files/files.service.js";

test("upload persists blob metadata and returns the public file fields", async () => {
    let storedBytes: Buffer | undefined;
    const storage = {
        put: async (bytes: Buffer) => {
            storedBytes = bytes;
            return { storageKey: "internal-key", sizeBytes: bytes.byteLength, sha256: "digest" };
        },
    };
    let savedMetadata: unknown;
    const repository = {
        create: async (...args: unknown[]) => {
            savedMetadata = args;
            return { uuid: "public-id", sizeBytes: 3, sha256: "digest" };
        },
    };
    const service = new FilesService(repository as never, storage as never);
    const bytes = Buffer.from("abc");

    assert.deepEqual(await service.upload(9, bytes), {
        uuid: "public-id",
        sizeBytes: 3,
        sha256: "digest",
    });
    assert.equal(storedBytes, bytes);
    assert.deepEqual(savedMetadata, [9, "internal-key", 3, "digest"]);
});

test("oversized uploads fail before reaching blob storage", async () => {
    let storageCalled = false;
    const storage = {
        put: async () => {
            storageCalled = true;
            throw new Error("must not store oversized input");
        },
    };
    const service = new FilesService({} as never, storage as never);
    const tooLarge = { byteLength: env.MAX_FILE_SIZE_BYTES + 1 } as Buffer;

    await assert.rejects(service.upload(9, tooLarge), FileTooLargeError);
    assert.equal(storageCalled, false);
});
