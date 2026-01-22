import {server} from "../src/api/server";

const supertest = require('supertest')

const request = supertest(server)

export default request
