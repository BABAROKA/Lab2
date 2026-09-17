declare global {
    namespace Express {
        interface Request {
            auth: {
                uuid: string;
            };
        }
    }
}

export { };
