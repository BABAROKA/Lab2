import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    CORS_ORIGIN: z.url(),
    JWT_ACCESS_KEY: z.string().min(32),
    JWT_REFRESH_KEY: z.string().min(32),
    NODE_ENV: z.enum(["dev", "prod"]),
    MAX_REFRESH_TOKEN_HISTORY: z.coerce.number().int().positive().default(50),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(2592000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables");
    console.error(z.treeifyError(parsedEnv.error));
    process.exit(1);
}

export const env = parsedEnv.data;
export type Env = typeof env;
