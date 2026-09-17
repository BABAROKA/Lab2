import { users } from "../../db/schema";

export type User = typeof users.$inferInsert;
export type NewUser = {
    username: string,
    email: string,
    passwordHash: string,
}
export type UpdateUser = {
    username?: string,
    email?: string,
}
