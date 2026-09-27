export const isUniqueViolation = (err: unknown): boolean => {
    let current: unknown = err;

    for (
        let depth = 0;
        depth < 4 && typeof current === "object" && current !== null;
        depth++
    ) {
        if ("code" in current && current.code === "23505") return true;
        current = "cause" in current ? current.cause : undefined;
    }

    return false;
};
