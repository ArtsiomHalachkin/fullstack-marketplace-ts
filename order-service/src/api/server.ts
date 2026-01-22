import {homepageController} from "./controllers/homepage/homepage.controller";
import {apiErrorHandler} from "../middleware/error.middleware";
import {OrderController} from "./controllers/order/order.controller"
import ExpresOAuthServer from '@node-oauth/express-oauth-server';
import express from "express";
import cors from "cors";
import {hasAnyRole} from "../middleware/auth.middleware";
import mongo from "../database/mongo";
import { oAuthModel } from "../middleware/auth.middleware";
import { setupSwagger } from "../swagger"

export const server = express();

const SWAGGER_PORT = 5003;

(async () => {
  await mongo.connect();
})();

// Middleware to parse JSON and URL-encoded data
server.use(express.json());
server.use(express.urlencoded({ extended: true }))

server.use(cors({
    origin: process.env.CORS_ORIGIN
}))

const auth = new ExpresOAuthServer({ model: oAuthModel as any });

setupSwagger(server, SWAGGER_PORT, "Order Service");

// Homepage
/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Service information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: Order Service
 */
server.get("/", homepageController.homepage);

const orderController = new OrderController();

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderStatus:
 *       type: string
 *       enum: [CREATED, CONFIRMED, CANCELLED, INQUIRY]
 *
 *     ChatRole:
 *       type: string
 *       enum: [buyer, seller, system]
 *
 *     ChatMessage:
 *       type: object
 *       required:
 *         - text
 *         - senderId
 *         - role
 *         - timestamp
 *       properties:
 *         text:
 *           type: string
 *           example: "Is this product still available?"
 *         senderId:
 *           type: string
 *           example: user-123
 *         role:
 *           $ref: '#/components/schemas/ChatRole'
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: 2025-01-01T12:00:00Z
 *
 *     OrderProduct:
 *       type: object
 *       required:
 *         - productId
 *         - name
 *         - price
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           example: product-123
 *         name:
 *           type: string
 *           example: Gaming Mouse
 *         description:
 *           type: string
 *           example: High DPI optical mouse
 *         price:
 *           type: number
 *           format: float
 *           example: 49.99
 *         quantity:
 *           type: integer
 *           example: 2
 *
 *     Order:
 *       type: object
 *       required:
 *         - userId
 *         - sellerId
 *         - products
 *         - totalPrice
 *         - status
 *       properties:
 *         userId:
 *           type: string
 *           example: user-123
 *         sellerId:
 *           type: string
 *           example: seller-456
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/OrderProduct'
 *         totalPrice:
 *           type: number
 *           format: float
 *           example: 99.98
 *         status:
 *           $ref: '#/components/schemas/OrderStatus'
 *         chatHistory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChatMessage'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-01-01T12:00:00Z
 *
 *     OrderInput:
 *       type: object
 *       required:
 *         - userId
 *         - sellerId
 *         - products
 *         - totalPrice
 *       properties:
 *         userId:
 *           type: string
 *         sellerId:
 *           type: string
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/OrderProduct'
 *         totalPrice:
 *           type: number
 *           format: float
 *
 *     UpdateOrder:
 *       type: object
 *       properties:
 *         orderId:
 *           type: string
 *         userId:
 *           type: string
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderProduct'
 *         totalPrice:
 *           type: number
 *           format: float
 *         status:
 *           $ref: '#/components/schemas/OrderStatus'
 */

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order management
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Retrieve all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of all orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
server.get("/orders", orderController.getAll.bind(orderController));

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid ID parameter
 *       404:
 *         description: Order not found
 */

server.get(
  "/orders/:id",
  [auth.authenticate(), hasAnyRole('USER', 'ADMIN')],
  orderController.getById.bind(orderController)
);

/**
 * @swagger
 * /orders/user/{id}:
 *   get:
 *     summary: Get orders by user ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (buyer)
 *     responses:
 *       200:
 *         description: Orders for the specified user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid userId parameter
 */
server.get(
  "/orders/user/:id",
  [auth.authenticate(), hasAnyRole('USER', 'ADMIN')],
  orderController.getByUserId.bind(orderController)
);

/**
 * @swagger
 * /orders/seller/{id}:
 *   get:
 *     summary: Get orders by seller ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: Orders for the specified seller
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid sellerId parameter
 */
server.get(
  "/orders/seller/:id",
  [auth.authenticate(), hasAnyRole('USER', 'ADMIN')],
  orderController.getBySellerId.bind(orderController)
);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 */
server.post("/orders", orderController.create.bind(orderController));

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update an existing order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrder'
 *     responses:
 *       202:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid ID or request body
 *       404:
 *         description: Order not found
 */
server.put("/orders/:id", orderController.update.bind(orderController));

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       204:
 *         description: Order deleted successfully
 *       400:
 *         description: Invalid ID parameter
 *       404:
 *         description: Order not found
 */
server.delete("/orders/:id", orderController.delete.bind(orderController));

/**
 * @swagger
 * /orders/conversations/initiate/{id}:
 *   post:
 *     summary: Initiate or retrieve an inquiry chat for a product
 *     description: >
 *       Creates or retrieves an inquiry chat room for a given product.
 *       The authenticated user becomes the buyer in the inquiry.
 *       This endpoint communicates with the Product Service to validate the product.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Inquiry chat room created or retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid product ID parameter
 *       401:
 *         description: Unauthorized (userId missing from token)
 *       404:
 *         description: Product not found
 *       502:
 *         description: Failed to fetch product details from Product Service
 *       500:
 *         description: Failed to create or retrieve inquiry chat room
 */

server.post(
  "/orders/conversations/initiate/:id",
  [auth.authenticate(), hasAnyRole('USER', 'ADMIN')],
  orderController.initiateChat.bind(orderController)
);

// Middleware: Error handling
server.use(apiErrorHandler);
