import { NextFunction, Request, Response } from "express";
import { ConversationNotFoundError, ForbiddenError } from "../../errors.js";
import { uuidParam } from "../../schemas/common.js";
import { ConversationPermissionName } from "../../db/schema/conversation_permissions.js";
import { ConversationsRepository } from "./conversations.repository.js";

const conversationsRepository = new ConversationsRepository();

export const requireConversationMember = async (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    const conversationUuid = uuidParam.parse(req.params.conversationUuid);

    const conversation = await conversationsRepository.findForMemberByUuid(
        conversationUuid,
        req.auth.id,
    );
    if (!conversation) throw new ConversationNotFoundError();

    req.conversationId = conversation.id;
    req.conversationUuid = conversation.uuid;
    next();
};

export const requireConversationPermission = (
    permission: ConversationPermissionName,
) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const conversationUuid = uuidParam.parse(req.params.conversationUuid);

        const conversation = await conversationsRepository.findForMemberByUuid(
            conversationUuid,
            req.auth.id,
        );
        if (!conversation) throw new ConversationNotFoundError();

        const allowed = await conversationsRepository.memberHasPermission(
            conversation.id,
            req.auth.id,
            permission,
        );
        if (!allowed) throw new ForbiddenError();

        req.conversationId = conversation.id;
        req.conversationUuid = conversation.uuid;
        next();
    };
};
