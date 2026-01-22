import {Config} from "../config"
import * as mongodb from "mongodb";

const mongo = {
    client: null as mongodb.MongoClient | null, 
    db: null as mongodb.Db | null,

    init() {
        if (!Config.mongo.url) {
            throw new Error("Mongo URL is not defined");
        }
        this.client = new mongodb.MongoClient(Config.mongo.url);
        this.db = this.client.db(Config.mongo.dbName);
    },

    async connect() {
        console.log("Connecting to Mongo...");

        if (!this.client) {
            this.init();
        }
        
        await this.client!.connect();

        console.log("Connected to Mongo.");
    },

    async disconnect() {
        if (this.client) {
            await this.client.close();
        }
    },
};

mongo.init();

export default mongo;
