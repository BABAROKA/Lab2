import { isUniqueViolation } from "../../db/errors.js";
import {
    AccountDeactivatedError,
    EmailAlreadyInUseError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    NewIpAddressError,
    RefreshTokenAlreadyUsedError,
    RefreshTokenExpiredError,
    RefreshTokenRevokedError,
    SamePasswordError,
    UserNotFoundError,
} from "../../errors.js";
import { UserRepository } from "../users/users.repository.js";
import { User } from "../users/users.schema.js";
import { AuthRepository } from "./auth.repository.js";
import {
    AuthResponse,
    IpAddress,
    LoginInput,
    RegisterInput,
} from "./auth.schemas.js";
import {
    generateTokens,
    hashPassword,
    hashToken,
    refreshTokenExpiry,
    verifyPassword,
    verifyRefreshToken,
} from "./auth.utils.js";

export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly authRepository: AuthRepository,
    ) { }

    /** @throws */
    async register(
        input: RegisterInput,
        ipAddress: IpAddress,
    ): Promise<AuthResponse> {
        if (await this.userRepository.findByEmail(input.email)) {
            throw new EmailAlreadyInUseError();
        }

        const passwordHash = await hashPassword(input.password);

        let user: User;
        try {
            user = await this.userRepository.createWithDefaultRole({
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                passwordHash,
            });
        } catch (err) {
            if (isUniqueViolation(err)) throw new EmailAlreadyInUseError();
            throw err;
        }

        return this.issueSession(user, ipAddress);
    }

    /** @throws */
    async login(
        input: LoginInput,
        ipAddress: IpAddress,
    ): Promise<AuthResponse> {
        const user = await this.userRepository.findByEmail(input.email);
        if (!user) throw new InvalidCredentialsError();

        const validPassword = await verifyPassword(
            input.password,
            user.passwordHash,
        );
        if (!validPassword) throw new InvalidCredentialsError();

        if (!user.isActive) throw new AccountDeactivatedError();

        return this.issueSession(user, ipAddress);
    }

    /** @throws */
    async logout(refreshToken: string): Promise<void> {
        const tokenData = await this.authRepository.findTokenByHash(
            hashToken(refreshToken),
        );
        if (!tokenData) return;

        await this.authRepository.revokeToken(tokenData.id);
    }

    /** @throws */
    async rotateRefreshToken(
        currentToken: string,
        ipAddress: IpAddress,
    ): Promise<AuthResponse> {
        verifyRefreshToken(currentToken);

        const tokenData = await this.authRepository.findTokenByHash(
            hashToken(currentToken),
        );
        if (!tokenData) throw new InvalidRefreshTokenError();

        if (tokenData.revokedAt !== null) {
            await this.authRepository.revokeAllForUser(tokenData.userId);
            throw new RefreshTokenRevokedError();
        }
        if (tokenData.expiresAt <= new Date())
            throw new RefreshTokenExpiredError();
        if (tokenData.ipAddress !== ipAddress) throw new NewIpAddressError();

        const user = await this.userRepository.findById(tokenData.userId);
        if (!user || !user.isActive) throw new InvalidRefreshTokenError();

        const tokens = generateTokens(user.uuid);

        const rotated = await this.authRepository.rotateToken(tokenData.id, {
            userId: user.id,
            tokenHash: hashToken(tokens.refreshToken),
            ipAddress,
            expiresAt: refreshTokenExpiry(),
        });
        if (!rotated) throw new RefreshTokenAlreadyUsedError();

        return { uuid: user.uuid, ...tokens };
    }

    /** @throws */
    async changePassword(
        uuid: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<Date> {
        const user = await this.userRepository.findByUuid(uuid);
        if (!user) throw new UserNotFoundError();

        if (!(await verifyPassword(currentPassword, user.passwordHash)))
            throw new InvalidCredentialsError();
        if (currentPassword === newPassword) throw new SamePasswordError();

        const updated = await this.userRepository.updatePasswordByUuid(
            uuid,
            await hashPassword(newPassword),
        );
        if (!updated) throw new UserNotFoundError();

        await this.authRepository.revokeAllForUser(user.id);
        return updated.updatedAt;
    }

    /** @throws */
    async deactivateAccount(uuid: string, password: string): Promise<Date> {
        const user = await this.userRepository.findByUuid(uuid);
        if (!user) throw new UserNotFoundError();

        if (!(await verifyPassword(password, user.passwordHash)))
            throw new InvalidCredentialsError();

        const updated = await this.userRepository.deactivateByUuid(uuid);
        if (!updated) throw new UserNotFoundError();

        await this.authRepository.revokeAllForUser(user.id);
        return updated.updatedAt;
    }

    private async issueSession(
        user: Pick<User, "id" | "uuid">,
        ipAddress: IpAddress,
    ): Promise<AuthResponse> {
        const tokens = generateTokens(user.uuid);

        await this.authRepository.createToken({
            userId: user.id,
            tokenHash: hashToken(tokens.refreshToken),
            ipAddress,
            expiresAt: refreshTokenExpiry(),
        });

        return { uuid: user.uuid, ...tokens };
    }
}
