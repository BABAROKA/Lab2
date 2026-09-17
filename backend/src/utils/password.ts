import argon2 from "argon2";

export const hashPassword = (password: string): Promise<string> => {
    return argon2.hash(password);
}

export const verifyPassword = (password: string, passwordHash: string): Promise<Boolean> => {
    return argon2.verify(passwordHash, password);
}
