import { z } from "zod";

export const importUserRowSchema = z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .nullable()
        .optional()
        .default(null),
    email: z.email().transform((e) => e.toLowerCase()),
    password: z.string().min(8).max(128),
});
