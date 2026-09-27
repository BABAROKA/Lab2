import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export interface BlobStorage {
    put(
        data: Buffer,
    ): Promise<{ storageKey: string; sizeBytes: number; sha256: string }>;
    get(storageKey: string): Promise<Buffer>;
    delete(storageKey: string): Promise<void>;
}

export class LocalDiskStorage implements BlobStorage {
    constructor(private readonly root: string) { }

    private pathFor(storageKey: string): string {
        return path.join(this.root, storageKey);
    }

    async put(
        data: Buffer,
    ): Promise<{ storageKey: string; sizeBytes: number; sha256: string }> {
        await mkdir(this.root, { recursive: true });

        const storageKey = randomUUID();
        await writeFile(this.pathFor(storageKey), data);

        return {
            storageKey,
            sizeBytes: data.byteLength,
            sha256: createHash("sha256").update(data).digest("hex"),
        };
    }

    async get(storageKey: string): Promise<Buffer> {
        return readFile(this.pathFor(storageKey));
    }

    async delete(storageKey: string): Promise<void> {
        await rm(this.pathFor(storageKey), { force: true });
    }
}
