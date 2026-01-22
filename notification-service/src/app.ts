import "reflect-metadata";
import {server} from "./api/server";

const port = process.env.PORT || 5002;

async function init() {

    server.listen(port, () => {
        console.log(`Listening on port ${port}...`);
    });
}

init();
