import { Request, Response } from "express";
import { sendList } from "../../lib/list-format.js";
import { uuidParam } from "../../schemas/common.js";
import { UserRepository } from "../users/users.repository.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { NotificationsRepository } from "../notifications/notifications.repository.js";
import { realtimeGateway } from "../../realtime/realtime-gateway.js";
import { ConversationsRepository } from "./conversations.repository.js";
import {
    assignRoleSchema,
    createConversationSchema,
    createInviteSchema,
    listConversationsQuerySchema,
    updateConversationSchema,
    updateSettingsSchema,
} from "./conversations.schemas.js";
import { ConversationsService } from "./conversations.service.js";

const conversationsService = new ConversationsService(
    new ConversationsRepository(),
    new UserRepository(),
    new NotificationsService(new NotificationsRepository()),
    realtimeGateway,
);

export const createConversation = async (req: Request, res: Response) => {
    const input = createConversationSchema.parse(req.body);
    const result = await conversationsService.create(req.auth.id, input);
    res.status(result.created ? 201 : 200).json(result.conversation);
};

export const listConversations = async (req: Request, res: Response) => {
    const query = listConversationsQuerySchema.parse(req.query);
    const rows = await conversationsService.listForUser(req.auth.id, query);
    sendList(res, "conversations", rows, query.format);
};

export const getConversation = async (req: Request, res: Response) => {
    res.json(
        await conversationsService.getForMember(
            req.conversationId!,
            req.auth.id,
        ),
    );
};

export const updateConversation = async (req: Request, res: Response) => {
    const input = updateConversationSchema.parse(req.body);
    res.json(
        await conversationsService.updateName(
            req.conversationId!,
            req.conversationUuid!,
            req.auth.id,
            input.name,
        ),
    );
};

export const listMembers = async (req: Request, res: Response) => {
    res.json(await conversationsService.listMembers(req.conversationId!));
};

export const addMember = async (req: Request, res: Response) => {
    const userUuid = uuidParam.parse(req.body.userUuid);
    await conversationsService.reAddMember(
        req.conversationId!,
        req.conversationUuid!,
        userUuid,
    );
    res.status(204).end();
};

export const removeMember = async (req: Request, res: Response) => {
    const userUuid = uuidParam.parse(req.params.userUuid);
    await conversationsService.removeMember(
        req.conversationId!,
        req.conversationUuid!,
        userUuid,
    );
    res.status(204).end();
};

export const leaveConversation = async (req: Request, res: Response) => {
    await conversationsService.leave(req.conversationId!, req.auth.id);
    res.status(204).end();
};

export const assignRole = async (req: Request, res: Response) => {
    const userUuid = uuidParam.parse(req.params.userUuid);
    const input = assignRoleSchema.parse(req.body);
    await conversationsService.assignRole(
        req.conversationId!,
        req.conversationUuid!,
        userUuid,
        input.role,
    );
    res.status(204).end();
};

export const getSettings = async (req: Request, res: Response) => {
    res.json(await conversationsService.getSettings(req.conversationId!));
};

export const updateSettings = async (req: Request, res: Response) => {
    const input = updateSettingsSchema.parse(req.body);
    res.json(
        await conversationsService.updateSettings(
            req.conversationId!,
            req.conversationUuid!,
            input,
        ),
    );
};

export const createInvite = async (req: Request, res: Response) => {
    const input = createInviteSchema.parse(req.body);
    res.status(201).json(
        await conversationsService.createInvite(
            req.conversationId!,
            req.conversationUuid!,
            req.auth.id,
            input,
        ),
    );
};

export const listInvitesForConversation = async (
    req: Request,
    res: Response,
) => {
    res.json(
        await conversationsService.listPendingForConversation(
            req.conversationId!,
        ),
    );
};

export const revokeInvite = async (req: Request, res: Response) => {
    const inviteUuid = uuidParam.parse(req.params.inviteUuid);
    await conversationsService.revokeInvite(req.conversationId!, inviteUuid);
    res.status(204).end();
};

export const listMyInvites = async (req: Request, res: Response) => {
    res.json(await conversationsService.listPendingForUser(req.auth.id));
};

export const acceptInvite = async (req: Request, res: Response) => {
    const inviteUuid = uuidParam.parse(req.params.inviteUuid);
    res.json(await conversationsService.acceptInvite(req.auth.id, inviteUuid));
};

export const declineInvite = async (req: Request, res: Response) => {
    const inviteUuid = uuidParam.parse(req.params.inviteUuid);
    await conversationsService.declineInvite(req.auth.id, inviteUuid);
    res.status(204).end();
};
