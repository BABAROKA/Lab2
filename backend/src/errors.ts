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
        super("Authentication required", 401);
    }
}
export class AccountDeactivatedError extends AppError {
    constructor() {
        super("Account is deactivated", 403);
    }
}
export class MissingClientIpError extends AppError {
    constructor() {
        super("Could not determine client IP address", 400);
    }
}
export class ForbiddenError extends AppError {
    constructor() {
        super("You do not have permission to do this", 403);
    }
}
export class ConversationNotFoundError extends AppError {
    constructor() {
        super("Conversation not found", 404);
    }
}
export class DirectConversationRequiresDistinctUsersError extends AppError {
    constructor() {
        super("A direct conversation requires two different users", 400);
    }
}
export class TargetNotConversationMemberError extends AppError {
    constructor() {
        super("That user is not a member of this conversation", 404);
    }
}
export class AlreadyConversationMemberError extends AppError {
    constructor() {
        super("That user is already a member of this conversation", 409);
    }
}
export class CannotRemoveLastOwnerError extends AppError {
    constructor() {
        super("Cannot remove or demote the last owner", 409);
    }
}
export class InviteNotFoundError extends AppError {
    constructor() {
        super("Invite not found", 404);
    }
}
export class InviteExpiredError extends AppError {
    constructor() {
        super("Invite has expired", 400);
    }
}
export class InviteAlreadyRespondedError extends AppError {
    constructor() {
        super("Invite has already been accepted or revoked", 409);
    }
}
export class NotInviteRecipientError extends AppError {
    constructor() {
        super("This invite was not sent to you", 403);
    }
}
export class DeviceNotFoundError extends AppError {
    constructor() {
        super("Device not found", 404);
    }
}
export class RecipientDeviceNotEligibleError extends AppError {
    constructor() {
        super(
            "One or more target devices are not eligible to receive this key",
            400,
        );
    }
}
export class MessageNotFoundError extends AppError {
    constructor() {
        super("Message not found", 404);
    }
}
export class NotMessageAuthorError extends AppError {
    constructor() {
        super("You can only do this to your own messages", 403);
    }
}
export class ReactionNotFoundError extends AppError {
    constructor() {
        super("Reaction not found", 404);
    }
}
export class FileNotFoundError extends AppError {
    constructor() {
        super("File not found", 404);
    }
}
export class FileTooLargeError extends AppError {
    constructor() {
        super("File is too large", 413);
    }
}
export class AlreadyBlockedError extends AppError {
    constructor() {
        super("User is already blocked", 409);
    }
}
export class NotBlockedError extends AppError {
    constructor() {
        super("User is not blocked", 404);
    }
}
export class CannotBlockSelfError extends AppError {
    constructor() {
        super("You cannot block yourself", 400);
    }
}
export class BlockedError extends AppError {
    constructor() {
        super(
            "This action is not possible due to a block between these users",
            403,
        );
    }
}
export class SettingNotFoundError extends AppError {
    constructor() {
        super("Setting not found", 404);
    }
}
export class RateLimitedError extends AppError {
    constructor() {
        super("Too many requests, please try again later", 429);
    }
}
export class NotificationNotFoundError extends AppError {
    constructor() {
        super("Notification not found", 404);
    }
}
