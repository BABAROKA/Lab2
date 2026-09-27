import { UserRepository } from "../users/users.repository";
import { NewUser, UpdateUser } from "./users.schema";

export class UserService {
    constructor(private readonly userRepository: UserRepository) { }

    /**
     * @throws
     */
    async updateUser(uuid: string, updateUser: UpdateUser): Promise<Date> {
        const result = await this.userRepository.updateByUuid(uuid, updateUser);
        if (!result) throw new Error();

        return result.updatedAt;
    }
}
