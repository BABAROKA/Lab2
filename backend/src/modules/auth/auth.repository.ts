import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../db/client";
import { refreshTokens } from "../../db/schema/refresh_tokens.js";
import { NewRefreshToken, RefreshToken, TokenHash } from "./auth.schemas";

export class AuthRepository {
    async findTokenByHash(tokenHash: TokenHash): Promise<RefreshToken | null> {
        const result = await db
            .select()
            .from(refreshTokens)
            .where(eq(refreshTokens.tokenHash, tokenHash))
            .limit(1)
            .execute();
        return result[0] ?? null;
    }

    async revokeToken(id: number): Promise<RefreshToken | null> {
        const result = await db
            .update(refreshTokens)
            .set({ revokedAt: new Date() })
            .where(
                and(eq(refreshTokens.id, id), isNull(refreshTokens.revokedAt)),
            )
            .returning()
            .execute();
        return result[0] ?? null;
    }

    async createToken(
        newRefreshToken: NewRefreshToken,
    ): Promise<RefreshToken | null> {
        const result = await db
            .insert(refreshTokens)
            .values(newRefreshToken)
            .returning()
            .execute();
        return result[0] ?? null;
    }

    async rotateToken(
        id: number,
        newRefreshToken: NewRefreshToken,
    ): Promise<RefreshToken | null> {
        return db.transaction(async (tx) => {
            const [revoked] = await tx
                .update(refreshTokens)
                .set({ revokedAt: new Date() })
                .where(
                    and(
                        eq(refreshTokens.id, id),
                        isNull(refreshTokens.revokedAt),
                    ),
                )
                .returning();

            if (!revoked) return null;

            await tx.insert(refreshTokens).values(newRefreshToken);
            return revoked;
        });

    }
}
