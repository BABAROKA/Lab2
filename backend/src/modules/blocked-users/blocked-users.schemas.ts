import { z } from "zod";

export const importBlockRowSchema = z.object({
    email: z.email().transform((e) => e.toLowerCase()),
});
