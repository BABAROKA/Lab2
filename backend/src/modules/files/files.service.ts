import { FileTooLargeError } from "../../errors.js";
import { BlobStorage } from "../../lib/blob-storage.js";
import { env } from "../../config/env.js";
import { FileRow, FilesRepository } from "./files.repository.js";

export class FilesService {
    constructor(
        private readonly filesRepository: FilesRepository,
        private readonly storage: BlobStorage,
    ) { }

    /** @throws */
    async upload(
        uploadedBy: number,
        data: Buffer,
    ): Promise<Pick<FileRow, "uuid" | "sizeBytes" | "sha256">> {
        if (data.byteLength > env.MAX_FILE_SIZE_BYTES)
            throw new FileTooLargeError();

        const stored = await this.storage.put(data);
        const row = await this.filesRepository.create(
            uploadedBy,
            stored.storageKey,
            stored.sizeBytes,
            stored.sha256,
        );

        return { uuid: row.uuid, sizeBytes: row.sizeBytes, sha256: row.sha256 };
    }

    async getBlobForConversationMember(
        fileUuid: string,
        userId: number,
    ): Promise<Buffer | null> {
        const file = await this.filesRepository.findForConversationMember(
            fileUuid,
            userId,
        );
        if (!file) return null;
        return this.storage.get(file.storageKey);
    }

    async getBlobOpen(fileUuid: string): Promise<Buffer | null> {
        const file = await this.filesRepository.findByUuid(fileUuid);
        if (!file) return null;
        return this.storage.get(file.storageKey);
    }
}
