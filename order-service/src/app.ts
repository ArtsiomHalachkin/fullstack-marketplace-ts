import "reflect-metadata";
import mongo from "./database/mongo";
import { createServer } from "http";
import { orderSocketServer} from "./socket/socket.server";
import { server as apiServer } from "./api/server";

const port = process.env.PORT || 3000;

async function init() {
    await mongo.connect();

    const httpServer = createServer(apiServer);

    orderSocketServer.init(httpServer);

    httpServer.listen(port, () => {
        console.log(`Order Service running on port ${port}...`);
    });
}

init();
