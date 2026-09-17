import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import type { NewUser, UpdateUser, User } from "./users.types.js";

export class UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        const result = await db.select().from(users).where(eq(users.email, email)).limit(1).execute();
        return result[0] ?? null;
    }

    async findByUsername(username: string): Promise<User | null> {
        const result = await db.select().from(users).where(eq(users.username, username)).limit(1).execute();
        return result[0] ?? null;
    }

    async findById(id: number): Promise<User | null> {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1).execute();
        return result[0] ?? null;
    }

    async findByUuid(uuid: string): Promise<User | null> {
        const result = await db.select().from(users).where(eq(users.uuid, uuid)).limit(1).execute();
        return result[0] ?? null;
    }

    async create(user: NewUser): Promise<User | null> {
        const result = await db.insert(users).values(user).returning().execute();
        return result[0] ?? null;
    }

    async updateById(id: number, user: UpdateUser): Promise<User | null> {
        const result = await db.update(users).set(user).where(eq(users.id, id)).returning().execute();
        return result[0] ?? null;
    }

    async updatePasswordById(id: number, passwordHash: string): Promise<User | null> {
        const result = await db.update(users).set({ passwordHash }).where(eq(users.id, id)).returning().execute();
        return result[0] ?? null;
    }
}
