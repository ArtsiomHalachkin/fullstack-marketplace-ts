import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from "vitest";
import mongo from "../../src/database/mongo";
import request from "../request";
import { Config } from "../../src/config";
import axios from "axios"; 
import { ObjectId } from 'mongodb';


const mockUserContext = {
    id: 'user-123',
    email: 'test@user.com',
    roles: ['USER'],
    failAuth: false
};

vi.mock('@node-oauth/express-oauth-server', () => {
    return {
        default: class MockOAuthServer {
            authenticate() {
                return (req: any, res: any, next: any) => {
                    if (mockUserContext.failAuth) {
                        return res.status(401).send('Unauthorized');
                    }
                    res.locals.oauth = {
                        token: {
                            user: {
                                id: mockUserContext.id,
                                email: mockUserContext.email,
                                roles: mockUserContext.roles
                            }
                        }
                    };
                    next();
                };
            }
        }
    };
});

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
}));

vi.mock("axios", async (importOriginal) => {
    const actual = await importOriginal<typeof import("axios")>();
    return {
        default: {
            ...actual.default,
            get: mocks.get,
            put: mocks.put,
            post: mocks.post,
        },
    };
});

const orderId = new ObjectId('c10000000000000000000001').toString();
const paymentId = new ObjectId('b1000000000000000000b123');
const nonExistentId = new ObjectId('d90000000000000000000000');

const testPayment = {
    _id: paymentId,
    orderId: orderId,
    amount: 99.99,
    currency: "USD",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    productId: 'prod-1',
    productQuantity: 1
};

describe('/payments', () => {

    beforeAll(async () => {
        await mongo.connect();
    });

    beforeEach(async () => {
        mockUserContext.roles = ['USER'];
        mockUserContext.failAuth = false;
        vi.clearAllMocks(); 

        // Reset DB
        if (mongo.db) {
            await mongo.db.collection("payments").deleteMany({});
            await mongo.db.collection("payments").insertOne(testPayment);
        }
    });

    afterAll(async () => {
        if (mongo.db) {
            await mongo.db.collection("payments").deleteMany({});
        }
        await mongo.disconnect();
    });

    describe('GET /payments', () => {
        it('should return 200 and all payments', async () => {
            const res = await request.get('/payments');
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].orderId).toBe(orderId);

        });
    });

    describe('GET /payments/:id (By Order ID)', () => {
        it('should return 200 and the correct payment', async () => {
            const res = await request.get(`/payments/${orderId}`);
            expect(res.status).toBe(200);
            expect(res.body.amount).toBe(99.99);
        });

        it('should return 404 for non-existent order ID', async () => {
            const res = await request.get(`/payments/${nonExistentId}`);
            expect(res.status).toBe(404);
        });

        it('should return 401 if auth fails', async () => {
            mockUserContext.failAuth = true;
            const res = await request.get(`/payments/${orderId}`);
            expect(res.status).toBe(401);
        });
    });

    describe('POST /payments', () => {
        const newPayment = {
            orderId: 'order-789',
            amount: 50.00,
            currency: 'EUR',
            status: 'PENDING',
            productId: 'prod-2',
            productQuantity: 2
        };

        it('should return 201 and create a payment', async () => {
            const res = await request.post('/payments').send(newPayment);
            expect(res.status).toBe(201);
            expect(res.body.orderId).toBe('order-789');

            const dbPayment = await mongo.db?.collection("payments").findOne({ orderId: 'order-789' });
            expect(dbPayment).toBeDefined();
        });

        it('should return 400 for invalid data', async () => {
            const res = await request.post('/payments').send({ amount: 'invalid-number' });
            expect(res.status).toBe(400);
        });
    });



    describe('PUT /payments/:id/update', () => {

        it('should return 202 and trigger stock reduction + email when status is SUCCEEDED', async () => {
            mocks.get.mockResolvedValueOnce({
                data: {
                    id: orderId,
                    products: [{ productId: 'prod-1', quantity: 1 }]
                }   
            });
            mocks.put.mockResolvedValueOnce({ data: { success: true } });
            mocks.post.mockResolvedValueOnce({ data: { success: true } });

    
            const res = await request
                .put(`/payments/${orderId}/update`)
                .set('Authorization', 'Bearer mock-token') 
                .send({ status: 'SUCCEEDED' });


            expect(res.status).toBe(202);
            expect(res.body.status).toBe('SUCCEEDED');


            expect(mocks.get).toHaveBeenCalledWith(
                expect.stringContaining(`${Config.orderService}/orders/${orderId}`),
                expect.anything()
            );


            expect(mocks.put).toHaveBeenCalledWith(
                expect.stringContaining(`${Config.productService}/products/prod-1/decrease-stock`),
                expect.objectContaining({ quantity: 1 }),
                expect.anything()
            );


            expect(mocks.post).toHaveBeenCalledWith(
                expect.stringContaining(`${Config.notificationService}/notify/email`),
                expect.objectContaining({
                    to: mockUserContext.email,
                    subject: expect.stringContaining('Payment Successful')
                })
            );

            expect(res.status).toBe(202);
            expect(res.body.status).toBe('SUCCEEDED');

        });

        it('should return 202 for status FAILED (No external calls)', async () => {
            const res = await request
                .put(`/payments/${orderId}/update`)
                .send({ status: 'FAILED' });

            expect(res.status).toBe(202);
            expect(res.body.status).toBe('FAILED');

     
            expect(mocks.get).not.toHaveBeenCalled();
            expect(mocks.put).not.toHaveBeenCalled();
            expect(mocks.post).not.toHaveBeenCalled();
        });

        it('should return 404 if payment does not exist', async () => {
            const res = await request
                .put(`/payments/${nonExistentId}/update`)
                .send({ status: 'SUCCEEDED' });
            expect(res.status).toBe(404);
        });
    });
});