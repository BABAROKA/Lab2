export class AppError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
    }
}

export class InvalidAccessTokenClaimsError extends AppError {
    constructor() {
        super("Invalid access token claims", 401);
    }
}

export class InvalidRefreshTokenClaimsError extends AppError {
    constructor() {
        super("Invalid refresh token claims", 401);
    }
}

export class EmailAlreadyInUseError extends AppError {
    constructor() {
        super("Email already in use", 409);
    }
}

export class UserNotFoundError extends AppError {
    constructor() {
        super("Not an existing user", 404);
    }
}

export class InvalidCredentialsError extends AppError {
    constructor() {
        super("Invalid credentials", 401);
    }
}

export class RefreshTokenRevokedError extends AppError {
    constructor() {
        super("Refresh token is revoked", 401);
    }
}

export class RefreshTokenExpiredError extends AppError {
    constructor() {
        super("Refresh token has expired", 401);
    }
}

export class NewIpAddressError extends AppError {
    constructor() {
        super("New IP address login is required", 401);
    }
}

export class RefreshTokenAlreadyUsedError extends AppError {
    constructor() {
        super("Refresh token already in use", 401);
    }
}

export class SamePasswordError extends AppError {
    constructor() {
        super("New password must be different from the current password", 400);
    }
}

export class InvalidRefreshTokenError extends AppError {
    constructor() {
        super("Invalid refresh token", 401);
    }
}

export class AuthenticationRequiredError extends AppError {
    constructor() {
        super("Authentication is rquired", 401);
    }
}
