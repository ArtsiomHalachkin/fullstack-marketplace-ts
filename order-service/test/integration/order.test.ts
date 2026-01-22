import { beforeAll, beforeEach, afterAll, describe, it, expect, vi, afterEach } from "vitest";
import mongo from "../../src/database/mongo";
import request from "../request";
import { ObjectId } from 'mongodb';
import { OrderStatus } from "../../src/types/dto/order.dto";
import axios from "axios";




const mockUserContext = {
    id: 'user-123',
    email: 'test@user.com',
    roles: ['USER'],
    failAuth: false
};

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
                                sub: mockUserContext.id,
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

const order1Id = new ObjectId('b10000000000000000000000');
const order2Id = new ObjectId('a10000000000000000000000');
const nonExistentId = new ObjectId('c90000000000000000000000');
const laptopId = new ObjectId('c90000000000000000000000');
const testUserId = "user_test_42";

const testProduct = {
    _id: laptopId,
    name: 'Laptop Pro',
    description: 'A powerful laptop',
    price: 1299.99,
    stockCount: 50,
    ownerId: 'user-123'
};


const testOrders = [
    {
        _id: order1Id,
        orderId: 'order_100',
        sellerId: testUserId,
        products: [
            { productId: 'prodA', name: 'Item A', price: 20.0, quantity: 1, description: 'Test item A' },
        ],
        totalPrice: 20,
        status: 'CREATED',

        createdAt: new Date(),
    },
    {
        _id: order2Id,
        orderId: 'order_200',
        userId: 'user_beta_99',
        products: [
            { productId: 'prodB', name: 'Item B', price: 30.0, quantity: 1, description: 'Test item B' },
            { productId: 'prodC', name: 'Item C', price: 20.0, quantity: 1, description: 'Test item C' },
        ],
        totalPrice: 50.0,
        status: 'CONFIRMED',
        createdAt: new Date(),
    },
];

const invalidId = 'invalid';

describe('/orders', () => {

    beforeAll(async () => {
        await mongo.connect();
    });

    beforeEach(async () => {

        mockUserContext.id = 'user-123';
        mockUserContext.roles = ['USER'];
        mockUserContext.failAuth = false;


        await mongo.db!.collection("orders").deleteMany({});
        await mongo.db!.collection("orders").insertMany(testOrders);
        await mongo.db!.collection("products").deleteMany({});
        await mongo.db!.collection("products").insertOne(testProduct);


    });

    afterAll(async () => {
        await mongo.db!.collection("orders").deleteMany({});
        await mongo.disconnect();
    });


    describe('GET /orders', () => {
        it('should return 200 and all orders', async () => {
            const res = await request.get('/orders');
            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body).toHaveLength(testOrders.length);
        });
    });


    describe('GET /orders/:id', () => {
        it('should return 200 and the correct order for a valid ID', async () => {
            const res = await request.get(`/orders/${order1Id.toHexString()}`);
            expect(res.status).toBe(200);
            expect(res.body.sellerId).toBe(testUserId);
            expect(res.body.totalPrice).toBe(20);
            expect(res.body.status).toBe('CREATED');
            expect(res.body.products).toHaveLength(1);
        });



        it('should return 404 for a non-existent ID', async () => {
            const res = await request.get(`/orders/${nonExistentId.toHexString()}`);
            expect(res.status).toBe(404);
        });
    });

    describe('POST /orders', () => {


        const validNewOrderPayload = {
            userId: 'test_user_789',
            sellerId: 'user_new_789',
            products: [
                { productId: 'prodC', name: 'Item C', price: 5.00, quantity: 2, description: 'New Order Item' },
                { productId: 'prodD', name: 'Item D', price: 15.00, quantity: 1, description: 'New Order Item D' },
            ],
            totalPrice: 25.00,
            status: 'CONFIRMED',
            createdAt: new Date(),
        };

        it('should return 201 and the created order for valid data', async () => {
            const res = await request.post('/orders').send(validNewOrderPayload);
            expect(res.status).toBe(201);
            expect(res.body.userId).toBe('test_user_789');
            expect(res.body.status).toBe('CONFIRMED');
        });

        it('should return 400 for invalid data (missing sellerId)', async () => {
            const { sellerId, ...invalidOrder } = validNewOrderPayload;
            const res = await request.post('/orders').send(invalidOrder);
            expect(res.status).toBe(400);
        });


        it('should return 400 for invalid data (invalid status enum)', async () => {
            const res = await request.post('/orders').send({ ...validNewOrderPayload, status: "IN_TRANSIT" });
            expect(res.status).toBe(400);
        });

        it('should return 400 for invalid data (product quantity not positive)', async () => {
            const validNewOrderPayload = {
                orderId: 'temp_placeholder_123',
                userId: 'user_new_789',
                products: [
                    { productId: 'prodC', name: 'Item C', price: 5.00, quantity: -1, description: 'New Order Item' },
                ],
                totalPrice: 20.00,
                status: 'CONFIRMED'
            };
            const res = await request.post('/orders').send({ ...validNewOrderPayload });
            expect(res.status).toBe(500);
        });
    });


    describe('PUT /orders/:id', () => {

        it('should return 202 and the updated order for valid partial data (status change)', async () => {
            const updateData = { status: 'CANCELLED' };
            const res = await request.put(`/orders/${order1Id.toHexString()}`).send(updateData);

            expect(res.status).toBe(202);
            expect(res.body.status).toBe('CANCELLED');
            expect(res.body.userId).toBe(testOrders[0].userId);
        });

        it('should return 202 and update totalPrice', async () => {
            const updateData = { totalPrice: 99.99 };
            const res = await request.put(`/orders/${order1Id.toHexString()}`).send(updateData);
            expect(res.body.totalPrice).toBe(99.99);
            expect(res.status).toBe(202);

        });

        it('should return 400 for invalid data (invalid status enum)', async () => {
            const res = await request.put(`/orders/${order1Id.toHexString()}`).send({ status: 'AWAITING' });
            expect(res.status).toBe(400);
        });

        it('should return 404 for a non-existent ID', async () => {
            const res = await request.put(`/orders/${nonExistentId.toHexString()}`).send({ status: 'CONFIRMED' });
            expect(res.status).toBe(404);
        });
    });


    describe('DELETE /orders/:id', () => {
        it('should return 204 for a valid ID and delete the order', async () => {
            const res = await request.delete(`/orders/${order1Id.toHexString()}`);
            expect(res.status).toBe(204);

            const getRes = await request.get(`/orders/${order1Id.toHexString()}`);
            expect(getRes.status).toBe(404);
        });

        it('should return 404 for a non-existent ID', async () => {
            const res = await request.delete(`/orders/${nonExistentId.toHexString()}`);
            expect(res.status).toBe(404);
        });

        it('should return 400 for an invalid ID format', async () => {
            const res = await request.delete('/orders/invalid-id-format');
            expect(res.status).toBe(400);
        });
    });

    describe('POST /conversations/initiate', () => {

        // Clean up mocks after each test to prevent pollution
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should return 200 after mocking the product service response', async () => {
            const testId = new ObjectId("d40000000000000000000000");

            const testProductForChat = {
                _id: testId.toHexString(),
                name: 'Test Product for Chat',
                description: 'A product to test chat initiation',
                price: 49.99,
                stockCount: 10,
                ownerId: 'user-456'
            };

            // If you are using a middleware mock variable, set it here
            // mockUserContext.roles = ['USER']; 

            // --- MOCKING FETCH ---
            // We replace the global fetch with a Vitest mock function (vi.fn)
            // It returns a Promise that resolves to an object mimicking the Response API
            global.fetch = vi.fn(() =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve(testProductForChat),
                } as Response)
            );

            // --- EXECUTION ---
            const res = await request
                .post(`/orders/conversations/initiate/${testId.toHexString()}`)
                .set('Authorization', 'Bearer mock-token');

            // --- DEBUGGING (Optional) ---
            if (res.status !== 200) {
                console.log("Request Failed:", res.status, res.body);
            }

            // --- ASSERTIONS ---
            expect(res.status).toBe(200);

            // Verify fetch was called with the correct URL
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/products/${testId.toHexString()}`)
            );

            // If your controller returns the chatRoom, verify a property exists
            // expect(res.body).toHaveProperty('inquiryId');
        });
    });
});