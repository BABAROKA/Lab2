import { Request, Response } from "express"

export const me = (req: Request, res: Response) => {
    res.json({
        uuid: req.auth.uuid,
    })
}
