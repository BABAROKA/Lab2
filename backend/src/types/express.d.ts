declare global {
    namespace Express {
        interface Request {
            auth: {
                id: number;
                uuid: string;
            };
            conversationId?: number;
            conversationUuid?: string;
        }
    }
}

export { };
