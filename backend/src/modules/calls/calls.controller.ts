import { Request, Response } from "express";
import { sendList } from "../../lib/list-format.js";
import { CallsRepository } from "./calls.repository.js";
import { searchCallsQuerySchema } from "./calls.schemas.js";

const callsRepository = new CallsRepository();

export const listMyCalls = async (req: Request, res: Response) => {
    const query = searchCallsQuerySchema.parse(req.query);
    const rows = await callsRepository.searchForUser(req.auth.id, query);
    sendList(res, "calls", rows, query.format);
};

export const listConversationCalls = async (req: Request, res: Response) => {
    const query = searchCallsQuerySchema.parse(req.query);
    const rows = await callsRepository.listForConversation(
        req.conversationId!,
        { limit: query.limit, before: query.before },
    );
    sendList(res, "calls", rows, query.format);
};
