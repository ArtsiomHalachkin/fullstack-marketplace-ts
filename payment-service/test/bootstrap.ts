import mongo from "../src/database/mongo";
import { afterAll, beforeAll, beforeEach } from 'vitest'

beforeAll(async () => {
    await mongo.connect()
});

beforeEach(async () => {
    const collections = await mongo.db!.listCollections().toArray();
    for (const { name } of collections) {
        await mongo.db!.collection(name).deleteMany({});
    }
});

afterAll(async () => {
    await mongo.disconnect()
});