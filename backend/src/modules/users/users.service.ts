import { isUniqueViolation } from "../../db/errors.js";
import { EmailAlreadyInUseError, UserNotFoundError } from "../../errors.js";
import { UserRepository } from "./users.repository.js";
import { UpdateUser, User, UserProfile } from "./users.schema.js";

const toProfile = (user: User): UserProfile => ({
    uuid: user.uuid,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt,
});

export class UserService {
    constructor(private readonly userRepository: UserRepository) { }

    /** @throws */
    async getProfile(uuid: string): Promise<UserProfile> {
        const user = await this.userRepository.findByUuid(uuid);
        if (!user) throw new UserNotFoundError();
        return toProfile(user);
    }

    /** @throws */
    async updateUser(uuid: string, update: UpdateUser): Promise<UserProfile> {
        try {
            const user = await this.userRepository.updateByUuid(uuid, update);
            if (!user) throw new UserNotFoundError();
            return toProfile(user);
        } catch (err) {
            if (isUniqueViolation(err)) throw new EmailAlreadyInUseError();
            throw err;
        }
    }
}
