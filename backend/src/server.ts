import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { setupWebsocket } from "./webscocket/index";

const httpServer = createServer(app);

setupWebsocket(httpServer);

httpServer.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
});
