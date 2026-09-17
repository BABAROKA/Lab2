import z from "zod";

export const UserSchema = z.object({
    id: z.number(),
    uuid: z.uuid(),
    firstName: z.string(),
    lastName: z.string().nullable(),
    email: z.email(),
    passwordHash: z.string(),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export const UpdateUserSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().nullable().optional(),
    email: z.email().optional(),
})

export const NewUserSchema = z.object({
    firstName: z.string(),
    lastName: z.string().nullable(),
    email: z.email(),
    passwordHash: z.string(),
})

export type User = z.infer<typeof UserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type NewUser = z.infer<typeof NewUserSchema>;
