import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from "vitest"; // Added 'vi'
import mongo from "../../src/database/mongo";
import request from "../request";
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



// --- Test Data ---
const laptopId = new ObjectId('b10000000000000000000000');
const mouseId = new ObjectId('a10000000000000000000000');
const nonExistentId = new ObjectId('c90000000000000000000000');

const testProducts = [
    {
        _id: laptopId,
        name: 'Laptop Pro',
        description: 'A powerful laptop',
        price: 1299.99,
        stockCount: 50,
        ownerId: 'user-123' 
    },
    {
        _id: mouseId,
        name: 'Wireless Mouse',
        description: 'A comfortable mouse',
        price: 49.95,
        stockCount: 100,
        ownerId: 'user-456' 
    },
];

describe('/products', () => {

    beforeAll(async () => {
        await mongo.connect();
    });

    beforeEach(async () => {

        mockUserContext.id = 'user-123';
        mockUserContext.roles = ['USER'];
        mockUserContext.failAuth = false;

        if (mongo.db) {
            await mongo.db.collection("products").deleteMany({});
            await mongo.db.collection("products").insertMany(testProducts);
        }
    });

    afterAll(async () => {
        if (mongo.db) {
            await mongo.db.collection("products").deleteMany({});
        }
        await mongo.disconnect();
    });

    describe('GET /products', () => {
        it('should return 200 and all products', async () => {
            const res = await request.get('/products');
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(testProducts.length);
        });
    });

    describe('GET /products/:id', () => {
        it('should return 200 and the correct product', async () => {
            const res = await request.get(`/products/${laptopId.toHexString()}`);
            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Laptop Pro');
        });

        it('should return 400 for invalid ID format', async () => {
            const res = await request.get('/products/invalid-id-format');
            expect(res.status).toBe(400);
        });

        it('should return 404 for a non-existent ID', async () => {
            const res = await request.get(`/products/${nonExistentId.toHexString()}`);
            expect(res.status).toBe(404);
        });
    });

    describe('GET /products/owner/me', () => {
        it('should return 200 and products for the authenticated owner', async () => {
            const res = await request.get('/products/owner/me');
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].name).toBe('Laptop Pro');
        });

        it('should return 401 if no authentication token provided', async () => {
            mockUserContext.failAuth = true;

            const res = await request.get('/products/owner/me');
            expect(res.status).toBe(401);
        });

        it('should return 403 if user does not have required role', async () => {
            mockUserContext.roles = []; // No roles
            const res = await request.get('/products/owner/me');
            expect(res.status).toBe(403);
        });
    });

  
    describe('POST /products', () => {
        const validNewProduct = {
            name: 'Mechanical Keyboard',
            description: 'Clicky',
            price: 89.90,
            stockCount: 75,
            ownerId: "user-123"
        };

        it('should return 201 and create product (User injected by Mock)', async () => {
            const res = await request.post('/products').send(validNewProduct);
            expect(res.status).toBe(201);
          
            expect(res.body.ownerId).toBe('user-123'); 
        });

        it('should return 400 for invalid data', async () => {
            const res = await request.post('/products').send({ ...validNewProduct, price: -10 });
            expect(res.status).toBe(400);
        });

        it('should return 401 if no authentication token provided', async () => {
            mockUserContext.failAuth = true;
            const res = await request.post('/products').send(validNewProduct);
            expect(res.status).toBe(401);
        });

        it('should return 403 if user does not have required role', async () => {
            mockUserContext.roles = []; 
            const res = await request.post('/products').send(validNewProduct);
            expect(res.status).toBe(403);
        });

    });

    describe('PUT /products/:id', () => {
        it('should return 202 and update product (Owner matches)', async () => {
            const updateData = { name: 'Laptop Pro v2' };
            const res = await request.put(`/products/${laptopId.toHexString()}`).send(updateData);
            console.log(res.body);
            expect(res.status).toBe(202);
            expect(res.body.name).toBe('Laptop Pro v2');
        });

        it('should return 400 for invalid ID parameter', async () => {
            const res = await request.put('/products/invalid-id-format').send({ name: 'Invalid Update' });
            expect(res.status).toBe(400);
        });

        it('should return 401 if no authentication token provided', async () => {
            mockUserContext.failAuth = true;
            const updateData = { name: 'Hacked Laptop' };
            const res = await request.put(`/products/${laptopId.toHexString()}`).send(updateData);
            expect(res.status).toBe(401);
      
        });

        it('should return 403 Forbidden if user does not own product', async () => {
            const res = await request.put(`/products/${mouseId.toHexString()}`).send({ name: 'Hacked Mouse' });
            expect(res.status).toBe(403); 
        });

        it('should return 404 for a non-existent ID', async () => {
            const res = await request.put(`/products/${nonExistentId.toHexString()}`).send({ name: 'Non-existent Product' });
            expect(res.status).toBe(404);
        });

    });

    describe('DELETE /products/:id', () => {
        it('should return 204 and delete product (Owner matches)', async () => {
            const res = await request.delete(`/products/${laptopId.toHexString()}`);
            expect(res.status).toBe(204);
        });

        it('should return 400 for invalid ID parameter', async () => {
            const res = await request.delete('/products/invalid-id-format');
            expect(res.status).toBe(400);
        });

        it('should return 401 if no authentication token provided', async () => {
            mockUserContext.failAuth = true;
            const res = await request.delete(`/products/${laptopId.toHexString()}`);
            expect(res.status).toBe(401);
   
        });

        it('should return 403 Forbidden if user does not own product', async () => {
            const res = await request.delete(`/products/${mouseId.toHexString()}`);
            expect(res.status).toBe(403);
        });
    
        it('should return 404 for a non-existent ID', async () => {
            const res = await request.delete(`/products/${nonExistentId.toHexString()}`);
            expect(res.status).toBe(404);
        });

    });
});