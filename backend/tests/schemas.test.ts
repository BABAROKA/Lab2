import assert from "node:assert/strict";
import test from "node:test";
import { loginSchema, registerSchema } from "../src/modules/auth/auth.schemas.js";
import { registerDeviceSchema } from "../src/modules/devices/devices.schemas.js";
import { sendMessageSchema } from "../src/modules/messages/messages.schemas.js";
import { limitSchema, listFormatSchema, positiveIntParam } from "../src/schemas/common.js";

test("registration trims names, normalizes email, and defaults nullable fields", () => {
    assert.deepEqual(
        registerSchema.parse({
            firstName: " Ada ",
            email: "ADA@EXAMPLE.COM",
            password: "password123",
        }),
        {
            firstName: "Ada",
            lastName: null,
            email: "ada@example.com",
            password: "password123",
        },
    );
    assert.equal(
        registerSchema.safeParse({ firstName: " ", email: "bad", password: "x" }).success,
        false,
    );
});

test("login accepts a valid normalized email and rejects empty passwords", () => {
    assert.deepEqual(loginSchema.parse({ email: "A@EXAMPLE.COM", password: "x" }), {
        email: "a@example.com",
        password: "x",
    });
    assert.equal(loginSchema.safeParse({ email: "a@example.com", password: "" }).success, false);
});

test("common query schemas coerce valid values and enforce bounds", () => {
    assert.equal(limitSchema.parse("25"), 25);
    assert.equal(limitSchema.parse(undefined), 50);
    assert.equal(limitSchema.safeParse("101").success, false);
    assert.equal(positiveIntParam.parse("7"), 7);
    assert.equal(positiveIntParam.safeParse("0").success, false);
    assert.equal(listFormatSchema.parse(undefined), "json");
    assert.equal(listFormatSchema.safeParse("pdf").success, false);
});

test("device registration requires a valid platform and key material", () => {
    const base = {
        name: " phone ",
        platform: "ios",
        identityPublicKey: "identity-key",
        signedPrekey: { keyId: 0, publicKey: "signed-key", signature: "sig" },
        oneTimePrekeys: [{ keyId: 1, publicKey: "one-time-key" }],
    };
    assert.equal(registerDeviceSchema.parse(base).name, "phone");
    assert.equal(registerDeviceSchema.safeParse({ ...base, platform: "unknown" }).success, false);
    assert.equal(registerDeviceSchema.safeParse({ ...base, oneTimePrekeys: [] }).success, false);
});

test("message schema supplies optional collection defaults and validates recipients", () => {
    const valid = {
        ciphertext: "encrypted",
        deviceKeys: [{ deviceUuid: "123e4567-e89b-42d3-a456-426614174000", encryptedKey: "key" }],
    };
    assert.deepEqual(sendMessageSchema.parse(valid), {
        ...valid,
        mentionUserUuids: [],
        attachments: [],
    });
    assert.equal(sendMessageSchema.safeParse({ ...valid, deviceKeys: [] }).success, false);
});
