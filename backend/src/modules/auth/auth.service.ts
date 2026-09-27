import {
    createAccessToken,
    createRefreshToken,
    generateTokens,
    hashToken,
    verifyRefreshToken,
} from "./auth.utils";
import { hashPassword, verifyPassword } from "./auth.utils";
import { UserRepository } from "../users/users.repository";
import {
    AuthResponse,
    IpAddress,
    LoginInput,
    RegisterInput,
} from "./auth.schemas";
import { AuthRepository } from "./auth.repository";
import {
    EmailAlreadyInUseError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    NewIpAddressError,
    RefreshTokenAlreadyUsedError,
    RefreshTokenExpiredError,
    RefreshTokenRevokedError,
    SamePasswordError,
    UserNotFoundError,
} from "../../errors";

export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly authRepository: AuthRepository,
    ) { }

    /**
     * @throws
     */
    async register(input: RegisterInput): Promise<AuthResponse> {
        const existingEmail = await this.userRepository.findByEmail(
            input.email,
        );
        if (existingEmail) {
            throw new EmailAlreadyInUseError();
        }

        const passwordHash = await hashPassword(input.password);

        const user = await this.userRepository.create({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            passwordHash,
        });

        if (!user?.uuid) {
            throw new UserNotFoundError();
        }

        const accessToken = createAccessToken(user.uuid);
        const refreshToken = createRefreshToken(user.uuid);

        return {
            uuid: user.uuid,
            accessToken,
            refreshToken,
        };
    }

    /**
     * @throws
     */
    async login(input: LoginInput): Promise<AuthResponse> {
        const user = await this.userRepository.findByEmail(input.email);
        if (!user) {
            throw new InvalidCredentialsError();
        }

        if (!user.uuid) {
            throw new UserNotFoundError();
        }

        const validPassword = await verifyPassword(input.password, user.passwordHash);
        if (!validPassword) {
            throw new InvalidCredentialsError();
        }

        const accessToken = createAccessToken(user.uuid);
        const refreshToken = createRefreshToken(user.uuid);

        return {
            uuid: user.uuid,
            accessToken,
            refreshToken,
        };
    }

    /*
     * @throws
     */
    async logout(refreshToken: string) {
        const tokenHash = hashToken(refreshToken);
        if (!tokenHash) throw new Error();

        const tokenData = await this.authRepository.findTokenByHash(tokenHash);
        if (!tokenData) return;

        this.authRepository.revokeToken(tokenData.id);
    }

    /**
     * @throws
     */
    async rotateRefreshToken(
        currentToken: string,
        ipAddress: IpAddress,
    ): Promise<AuthResponse> {
        const claims = verifyRefreshToken(currentToken);

        const currentTokenHash = hashToken(currentToken);
        if (!currentTokenHash) throw new Error();

        const tokenData =
            await this.authRepository.findTokenByHash(currentTokenHash);
        if (!tokenData) throw new InvalidRefreshTokenError();
        if (tokenData.revokedAt !== null) throw new RefreshTokenRevokedError();
        if (tokenData.expiresAt <= new Date())
            throw new RefreshTokenExpiredError();
        if (tokenData.ipAddress !== ipAddress) throw new NewIpAddressError();

        const userData = await this.userRepository.findByUuid(claims.sub);
        if (!userData || !userData.isActive)
            throw new InvalidRefreshTokenError();

        const tokens = generateTokens(userData.uuid);
        const refreshClaims = verifyRefreshToken(tokens.refreshToken);

        const newRefreshTokenHash = hashToken(tokens.refreshToken);
        if (!newRefreshTokenHash) throw new Error();

        const newRefreshToken = {
            userId: userData.id,
            tokenHash: newRefreshTokenHash,
            ipAddress,
            expiresAt: new Date(refreshClaims.exp * 1000),
        };
        const revokedToken = this.authRepository.rotateToken(
            tokenData.id,
            newRefreshToken,
        );
        if (!revokedToken) throw new RefreshTokenAlreadyUsedError();

        return {
            uuid: userData.uuid,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    /**
     * @throws
     */
    async changePassword(
        uuid: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<Date> {
        const newPasswordHash = await hashPassword(newPassword);

        const userData = await this.userRepository.findByUuid(uuid);
        if (!userData) throw new UserNotFoundError();

        const validCurrentPassword = await verifyPassword(
            currentPassword,
            userData.passwordHash,
        );
        if (!validCurrentPassword) throw new InvalidCredentialsError();

        const verifyNewPassword = await verifyPassword(
            newPassword,
            userData.passwordHash,
        );
        if (verifyNewPassword) throw new SamePasswordError();

        const result = await this.userRepository.updatePasswordByUuid(
            uuid,
            newPasswordHash,
        );
        if (!result) throw new Error();

        return result.updatedAt;
    }

    /**
     * @throws
     */
    async deactivateAccount(uuid: string, password: string) {
        const passwordHash = await hashPassword(password);
        const userData = await this.userRepository.findByUuid(uuid);
        if (!userData) throw new UserNotFoundError();

        const validPassword = await verifyPassword(
            password,
            userData.passwordHash,
        );
        if (validPassword) throw new InvalidCredentialsError();

        const result = await this.userRepository.deactivateByUuid(uuid);
        if (!result) throw new Error();

        return result.updatedAt;
    }
}
