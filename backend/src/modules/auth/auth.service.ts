import { createAccessToken, createRefreshToken } from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { UserRepository } from "../users/users.repository.js";
import { AuthResponse, LoginInput, RefreshToken, RegisterInput } from "./auth.schemas.js";
import { hashToken } from "./auth.utils.js";

export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly authRepository: AuthResponse,
    ) { }

    async register(input: RegisterInput) {
        const existingEmail = await this.userRepository.findByEmail(input.email);
        if (!existingEmail) {
            throw new Error("Email already in use");
        }

        const passwordHash = await hashPassword(input.password);

        const user = await this.userRepository.create({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            passwordHash
        });

        if (!user?.uuid) {
            throw new Error("Not an existing user");
        }

        const accessToken = createAccessToken(user.uuid);
        const refreshToken = createRefreshToken(user.uuid);

        return {
            uuid: user.uuid,
            accessToken,
            refreshToken
        }
    }

    async login(input: LoginInput): Promise<AuthResponse> {
        const user = await this.userRepository.findByEmail(input.email);
        if (!user) {
            throw new Error("Invalid credentials");
        }

        if (!user.uuid) {
            throw new Error("Not an existing user");
        }

        const validPassword = verifyPassword(input.password, user.passwordHash);
        if (!validPassword) {
            throw new Error("Invalid credentials")
        }

        const accessToken = createAccessToken(user.uuid);
        const refreshToken = createRefreshToken(user.uuid);

        return {
            uuid: user.uuid,
            accessToken,
            refreshToken
        }
    }

    async rotate_token(refreshToken: RefreshToken) {
        const tokenHash = hashToken()
    }
}
