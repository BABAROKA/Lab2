import assert from "node:assert/strict";
import test from "node:test";
import { AccountDeactivatedError, InvalidCredentialsError } from "../src/errors.js";
import { hashPassword } from "../src/modules/auth/auth.utils.js";
import { AuthService } from "../src/modules/auth/auth.service.js";

const user = async (isActive = true) => ({
    id: 4,
    uuid: "123e4567-e89b-42d3-a456-426614174000",
    passwordHash: await hashPassword("correct-password"),
    isActive,
});

const createService = (record: Awaited<ReturnType<typeof user>>) => {
    const userRepository = {
        findByEmail: async () => record,
    };
    const authRepository = {
        createToken: async (entry: unknown) => entry,
    };
    return new AuthService(userRepository as never, authRepository as never);
};

test("login issues access and refresh tokens for a valid active account", async () => {
    const result = await createService(await user()).login(
        { email: "a@example.com", password: "correct-password" },
        "127.0.0.1",
    );
    assert.equal(result.uuid, "123e4567-e89b-42d3-a456-426614174000");
    assert.ok(result.accessToken.length > 0);
    assert.ok(result.refreshToken.length > 0);
});

test("login rejects an incorrect password", async () => {
    await assert.rejects(
        createService(await user()).login(
            { email: "a@example.com", password: "wrong-password" },
            "127.0.0.1",
        ),
        InvalidCredentialsError,
    );
});

test("login rejects a deactivated account after password verification", async () => {
    await assert.rejects(
        createService(await user(false)).login(
            { email: "a@example.com", password: "correct-password" },
            "127.0.0.1",
        ),
        AccountDeactivatedError,
    );
});
