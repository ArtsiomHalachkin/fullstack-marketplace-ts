import "reflect-metadata";
import {server} from "./api/server";
import mongo from "./database/mongo";

const port = process.env.PORT || 3000;

async function init() {
    await mongo.connect();

    server.listen(port, () => {
        console.log(`Listening on port ${port}...`);
    });
}

init();
