import assert from "node:assert/strict";
import test from "node:test";
import {
    AlreadyBlockedError,
    AlreadyConversationMemberError,
    CannotRemoveLastOwnerError,
    DirectConversationRequiresDistinctUsersError,
    DeviceNotFoundError,
    ForbiddenError,
    NotInviteRecipientError,
    NotMessageAuthorError,
    NotificationNotFoundError,
    UserNotFoundError,
} from "../src/errors.js";
import { BlockedUsersService } from "../src/modules/blocked-users/blocked-users.service.js";
import { ConversationsService } from "../src/modules/conversations/conversations.service.js";
import { DevicesService } from "../src/modules/devices/devices.service.js";
import { MessagesService } from "../src/modules/messages/messages.service.js";
import { NotificationsService } from "../src/modules/notifications/notifications.service.js";

const uuid1 = "123e4567-e89b-42d3-a456-426614174000";
const uuid2 = "123e4567-e89b-42d3-a456-426614174001";
const stamp = new Date("2026-01-01T00:00:00Z");
const conversation = {
    id: 10,
    uuid: uuid1,
    type: "group",
    name: "team",
    createdAt: stamp,
    updatedAt: stamp,
};
const user = { id: 2, uuid: uuid2 };

const conversationService = (
    repo: Record<string, unknown>,
    userRepo: Record<string, unknown> = {},
    notifications: Record<string, unknown> = {},
    realtime: Record<string, unknown> = {},
) =>
    new ConversationsService(
        repo as never,
        userRepo as never,
        notifications as never,
        realtime as never,
    );

const deviceService = (
    repo: Record<string, unknown>,
    userRepo: Record<string, unknown> = {},
    blocks: Record<string, unknown> = {},
) => new DevicesService(repo as never, userRepo as never, blocks as never);

const messageService = (
    repo: Record<string, unknown>,
    devices: Record<string, unknown> = {},
    realtime: Record<string, unknown> = {},
) => new MessagesService(repo as never, {} as never, devices as never, {} as never, realtime as never);

test("direct conversation creation rejects an unknown peer", async () => {
    const service = conversationService({}, { findByUuid: async () => null });
    await assert.rejects(
        service.create(1, { type: "direct", peerUuid: uuid2 }),
        UserNotFoundError,
    );
});

test("direct conversation creation rejects the current user as peer", async () => {
    const service = conversationService({}, { findByUuid: async () => ({ id: 1, uuid: uuid1 }) });
    await assert.rejects(
        service.create(1, { type: "direct", peerUuid: uuid1 }),
        DirectConversationRequiresDistinctUsersError,
    );
});

test("direct conversation creation reuses an existing conversation", async () => {
    let created = false;
    const service = conversationService(
        {
            findDirectBetween: async () => conversation,
            createDirect: async () => { created = true; return conversation; },
        },
        { findByUuid: async () => user },
    );
    const result = await service.create(1, { type: "direct", peerUuid: uuid2 });
    assert.equal(result.created, false);
    assert.equal(result.conversation.uuid, uuid1);
    assert.equal(created, false);
});

test("new direct conversation joins both participants to realtime", async () => {
    const joined: number[] = [];
    const service = conversationService(
        {
            findDirectBetween: async () => null,
            createDirect: async () => conversation,
        },
        { findByUuid: async () => user },
        {},
        { joinConversation: (uid: number) => joined.push(uid) },
    );
    const result = await service.create(1, { type: "direct", peerUuid: uuid2 });
    assert.equal(result.created, true);
    assert.deepEqual(joined, [1, 2]);
});

test("group creation joins the creator and returns a public DTO", async () => {
    let joined = 0;
    const service = conversationService(
        { createGroup: async () => ({ ...conversation, internalSecret: "hidden" }) },
        {},
        {},
        { joinConversation: () => { joined++; } },
    );
    const result = await service.create(5, { type: "group", name: "team" });
    assert.equal(joined, 1);
    assert.deepEqual(Object.keys(result.conversation).sort(), ["createdAt", "name", "type", "updatedAt", "uuid"]);
});

test("removing a nonmember is rejected before repository mutation", async () => {
    let removed = false;
    const service = conversationService(
        { findActiveMember: async () => null, removeMember: async () => { removed = true; } },
        { findByUuid: async () => user },
    );
    await assert.rejects(service.removeMember(10, uuid1, uuid2), /not a member/i);
    assert.equal(removed, false);
});

test("removing the only owner is rejected", async () => {
    let removed = false;
    const service = conversationService(
        {
            findActiveMember: async () => ({ id: 20 }),
            getMemberRole: async () => "owner",
            countOwners: async () => 1,
            removeMember: async () => { removed = true; },
        },
        { findByUuid: async () => user },
    );
    await assert.rejects(service.removeMember(10, uuid1, uuid2), CannotRemoveLastOwnerError);
    assert.equal(removed, false);
});

test("a regular member can leave and is removed from realtime", async () => {
    const events: string[] = [];
    const service = conversationService(
        { getMemberRole: async () => "member", removeMember: async () => { events.push("removed"); } },
        {},
        {},
        { leaveConversation: () => { events.push("left"); } },
    );
    await service.leave(10, 2);
    assert.deepEqual(events, ["removed", "left"]);
});

test("readding an already active conversation member is rejected", async () => {
    const service = conversationService(
        { findActiveMember: async () => ({ id: 1 }) },
        { findByUuid: async () => user },
    );
    await assert.rejects(service.reAddMember(10, uuid1, uuid2), AlreadyConversationMemberError);
});

test("role assignment updates the membership and emits the role event", async () => {
    const events: unknown[] = [];
    const service = conversationService(
        {
            findActiveMember: async () => ({ id: 20 }),
            getMemberRole: async () => "member",
            findRoleByName: async () => ({ id: 30 }),
            setMemberRole: async (memberId: number, roleId: number) => events.push([memberId, roleId]),
        },
        { findByUuid: async () => user },
        {},
        { emitToConversation: (...args: unknown[]) => events.push(args) },
    );
    await service.assignRole(10, uuid1, uuid2, "admin" as never);
    assert.equal(events.length, 2);
});

test("missing conversation settings are represented as null", async () => {
    const service = conversationService({ getSettings: async () => null });
    assert.equal(await service.getSettings(10), null);
});

test("settings update returns the saved values and emits the update event", async () => {
    let emitted = false;
    const settings = {
        disappearingMessages: true,
        disappearingMessagesSeconds: 60,
        createdAt: stamp,
        updatedAt: stamp,
    };
    const service = conversationService(
        { upsertSettings: async () => settings },
        {},
        {},
        { emitToConversation: () => { emitted = true; } },
    );
    assert.deepEqual(await service.updateSettings(10, uuid1, settings), settings);
    assert.equal(emitted, true);
});

test("invite creation stores invite, notifies the recipient, and emits realtime", async () => {
    let notified = false;
    let emitted = false;
    const invite = { id: 4, uuid: uuid2, expiresAt: stamp, createdAt: stamp };
    const service = conversationService(
        {
            findActiveMember: async () => null,
            createInvite: async () => invite,
        },
        { findByUuid: async () => user },
        { notify: async () => { notified = true; } },
        { emitToUser: () => { emitted = true; } },
    );
    const result = await service.createInvite(10, uuid1, 1, { inviteeUuid: uuid2, expiresInHours: 1 });
    assert.equal(result.uuid, uuid2);
    assert.equal(notified, true);
    assert.equal(emitted, true);
});

test("accepting another user's invite is rejected", async () => {
    const service = conversationService({ findInviteByUuid: async () => ({ inviteeId: 5 }) });
    await assert.rejects(service.acceptInvite(6, uuid2), NotInviteRecipientError);
});

test("accepting a valid invite adds the member and returns its conversation UUID", async () => {
    const events: string[] = [];
    const invite = { id: 3, inviteeId: 2, conversationId: 10, expiresAt: new Date(Date.now() + 60_000), acceptedAt: null, revokedAt: null };
    const service = conversationService(
        {
            findInviteByUuid: async () => invite,
            findRoleByName: async () => ({ id: 8 }),
            findById: async () => conversation,
            acceptInviteAndJoin: async () => { events.push("accepted"); },
        },
        {},
        {},
        { joinConversation: () => { events.push("joined"); }, emitToConversation: () => { events.push("emitted"); } },
    );
    assert.deepEqual(await service.acceptInvite(2, uuid2), { conversationUuid: uuid1 });
    assert.deepEqual(events, ["accepted", "joined", "emitted"]);
});

test("declining a pending invite revokes it", async () => {
    let revoked = 0;
    const service = conversationService({
        findInviteByUuid: async () => ({ id: 9, inviteeId: 2, acceptedAt: null, revokedAt: null }),
        markInviteRevoked: async (id: number) => { revoked = id; },
    });
    await service.declineInvite(2, uuid2);
    assert.equal(revoked, 9);
});

test("device registration returns only own-device fields", async () => {
    const service = deviceService({
        createWithKeys: async () => ({ uuid: uuid1, name: "phone", platform: "ios", isActive: true, lastSeenAt: stamp, createdAt: stamp, identityPublicKey: "secret" }),
    });
    const result = await service.registerDevice(1, {} as never);
    assert.equal("identityPublicKey" in result, false);
    assert.equal(result.uuid, uuid1);
});

test("revoking an unknown device reports not found", async () => {
    const service = deviceService({ revoke: async () => null });
    await assert.rejects(service.revokeDevice(1, uuid1), DeviceNotFoundError);
});

test("prekey top-up rejects an inactive or unknown device", async () => {
    const service = deviceService({ findActiveByUuidForUser: async () => null });
    await assert.rejects(service.topUpPrekeys(1, uuid1, { oneTimePrekeys: [] } as never), DeviceNotFoundError);
});

test("prekey top-up persists keys for the resolved device", async () => {
    let saved: unknown[] = [];
    const service = deviceService({
        findActiveByUuidForUser: async () => ({ id: 12 }),
        addOneTimePrekeys: async (id: number, keys: unknown[]) => { saved = [id, keys]; },
    });
    const keys = [{ keyId: 1, publicKey: "pk" }];
    await service.topUpPrekeys(1, uuid1, { oneTimePrekeys: keys } as never);
    assert.deepEqual(saved, [12, keys]);
});

test("device discovery hides devices when either user has blocked the other", async () => {
    let queried = false;
    const service = deviceService(
        { listActiveForUser: async () => { queried = true; return []; } },
        { findByUuid: async () => user },
        { isBlockedEitherWay: async () => true },
    );
    assert.deepEqual(await service.listDevicesForUser(1, uuid2), []);
    assert.equal(queried, false);
});

test("prekey bundle returns signed and one-time keys for an eligible device", async () => {
    const service = deviceService(
        {
            findByUuid: async () => ({ id: 7, uuid: uuid1, userId: 2, isActive: true, identityPublicKey: "identity" }),
            findActiveSignedPrekey: async () => ({ keyId: 5, publicKey: "signed", signature: "sig" }),
            claimOneTimePrekey: async () => ({ keyId: 6, publicKey: "one-time" }),
        },
        {},
        { isBlockedEitherWay: async () => false },
    );
    const bundle = await service.getPrekeyBundle(1, uuid1);
    assert.equal(bundle.signedPrekey.keyId, 5);
    assert.equal(bundle.oneTimePrekey?.keyId, 6);
});

test("prekey bundle rejects a missing device", async () => {
    const service = deviceService({ findByUuid: async () => null });
    await assert.rejects(service.getPrekeyBundle(1, uuid1), DeviceNotFoundError);
});

test("blocking oneself is rejected", async () => {
    const service = new BlockedUsersService({} as never, { findByUuid: async () => ({ id: 1 }) } as never);
    await assert.rejects(service.block(1, uuid1), /cannot block yourself/i);
});

test("blocking an already blocked user reports conflict", async () => {
    const service = new BlockedUsersService(
        { isBlocked: async () => true } as never,
        { findByUuid: async () => user } as never,
    );
    await assert.rejects(service.block(1, uuid2), AlreadyBlockedError);
});

test("unblocking a blocked user removes that relationship", async () => {
    let removed: unknown[] = [];
    const service = new BlockedUsersService(
        { unblock: async (...args: unknown[]) => { removed = args; return true; } } as never,
        { findByUuid: async () => user } as never,
    );
    await service.unblock(1, uuid2);
    assert.deepEqual(removed, [1, 2]);
});

test("block import reports invalid, missing, self, and successful rows independently", async () => {
    const blocked: number[] = [];
    const service = new BlockedUsersService(
        { block: async (_blocker: number, target: number) => { blocked.push(target); } } as never,
        { findByEmail: async (email: string) => email === "self@example.com" ? { id: 1 } : email === "peer@example.com" ? user : null } as never,
    );
    const result = await service.importBlocks(1, [
        { email: "bad" },
        { email: "missing@example.com" },
        { email: "self@example.com" },
        { email: "PEER@example.com" },
    ]);
    assert.equal(result.imported, 1);
    assert.deepEqual(result.failed.map((row) => row.row), [0, 1, 2]);
    assert.deepEqual(blocked, [2]);
});

test("notification read rejects an ID that does not belong to the user", async () => {
    const service = new NotificationsService({ markRead: async () => false } as never);
    await assert.rejects(service.markRead(1, 9), NotificationNotFoundError);
});

test("notification search and unread count delegate to the repository", async () => {
    const service = new NotificationsService({
        search: async () => [{ id: 1 }],
        countUnread: async () => 3,
    } as never);
    assert.deepEqual(await service.search(1, { limit: 5 } as never), [{ id: 1 }]);
    assert.equal(await service.countUnread(1), 3);
});

test("editing another user's message is forbidden", async () => {
    const service = messageService({
        findInConversation: async () => ({ senderId: 3, deletedAt: null }),
    });
    await assert.rejects(service.edit(10, uuid1, 2, 7, { ciphertext: "new" }), NotMessageAuthorError);
});

test("delete-any permission allows a moderator to soft-delete another user's message", async () => {
    let deleted = false;
    let emitted = false;
    const service = messageService(
        {
            findInConversation: async () => ({ senderId: 3, deletedAt: null }),
            softDelete: async () => { deleted = true; },
        },
        {},
        { emitToConversation: () => { emitted = true; } },
    );
    await service.remove(10, uuid1, 2, 7, true);
    assert.equal(deleted, true);
    assert.equal(emitted, true);
});

test("message read requires an active device owned by the reader", async () => {
    const service = messageService({}, { findActiveByUuidForUser: async () => null });
    await assert.rejects(service.markRead(10, uuid1, 2, uuid2, 7, uuid1), ForbiddenError);
});
