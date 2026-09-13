import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    CORS_ORIGIN: z.url(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables");
    console.error(z.treeifyError(parsedEnv.error));
    process.exit(1);
}

export const env = parsedEnv.data;
export type Env = typeof env;
