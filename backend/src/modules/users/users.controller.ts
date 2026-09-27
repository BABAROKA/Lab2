import { Request, Response } from "express"
import { UserService } from "./users.service"
import { UserRepository } from "./users.repository"
import { UpdateUserSchema } from "./users.schema";

const userService = new UserService(new UserRepository);

export const me = async (req: Request, res: Response) => {
    return res.json({
        uuid: req.auth.uuid,
    });
}

export const updateUser = async (req: Request, res: Response) => {
    const updateUser = UpdateUserSchema.parse(req.body);
    const updatedAt = await userService.updateUser(req.auth.uuid, updateUser);

    return res.json({
        updatedAt
    })
}
