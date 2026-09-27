import { z } from "zod";

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
});

export const UpdateUserSchema = z
    .strictObject({
        firstName: z.string().trim().min(1).max(100).optional(),
        lastName: z.string().trim().min(1).max(100).nullable().optional(),
        email: z
            .email()
            .transform((email) => email.toLowerCase())
            .optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "Nothing to update",
    });

export const NewUserSchema = z.object({
    firstName: z.string(),
    lastName: z.string().nullable(),
    email: z.email(),
    passwordHash: z.string(),
});

export const setProfilePictureSchema = z.object({
    fileUuid: z.uuid(),
    deviceKeys: z
        .array(
            z.object({
                deviceUuid: z.uuid(),
                encryptedProfilePictureKey: z.string().min(1),
            }),
        )
        .min(1),
});

export type User = z.infer<typeof UserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type NewUser = z.infer<typeof NewUserSchema>;
export type SetProfilePictureInput = z.infer<typeof setProfilePictureSchema>;

export type UserProfile = Pick<
    User,
    "uuid" | "firstName" | "lastName" | "email" | "createdAt"
>;
