import assert from "node:assert/strict";
import test from "node:test";
import { MessageNotFoundError } from "../src/errors.js";
import { MessagesService } from "../src/modules/messages/messages.service.js";

test("removeReaction rejects a message outside the requested conversation", async () => {
    let reactionRemovalAttempted = false;
    const repository = {
        findInConversation: async () => null,
        removeReaction: async () => {
            reactionRemovalAttempted = true;
            return true;
        },
    };
    const service = new MessagesService(
        repository as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
    );

    await assert.rejects(
        service.removeReaction(10, "conversation-uuid", 2, "user-uuid", 99, "👍"),
        MessageNotFoundError,
    );
    assert.equal(reactionRemovalAttempted, false);
});
