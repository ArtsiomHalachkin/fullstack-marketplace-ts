import express from "express";
import cors from "cors";
import paymentController from "./controllers/payment/payment.controller";
import mongo from "../database/mongo";
import { homepageController } from "./controllers/homepage/homepage.controller";
import { apiErrorHandler } from "../middleware/error.middleware";

import {hasAnyRole, oAuthModel} from "../middleware/auth.middleware";
import ExpresOAuthServer from '@node-oauth/express-oauth-server';
import { setupSwagger } from "../swagger"

export const server = express();
const SWAGGER_PORT = 5004;



(async () => {
  await mongo.connect();
})();

server.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
server.use(express.json());

setupSwagger(server, SWAGGER_PORT, "Order Service");

const auth = new ExpresOAuthServer({ model: oAuthModel as any });

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
 *                   example: Payment Service
 */

server.get("/", homepageController.homepage);

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentStatus:
 *       type: string
 *       description: Current payment state
 *       enum:
 *         - PENDING
 *         - SUCCEEDED
 *         - FAILED
 *
 *     Payment:
 *       type: object
 *       required:
 *         - orderId
 *         - amount
 *         - status
 *         - productId
 *         - productQuantity
 *       properties:
 *         id:
 *           type: string
 *           example: payment-123
 *         orderId:
 *           type: string
 *           example: order-456
 *         productId:
 *           type: string
 *           description: Purchased product identifier
 *           example: product-789
 *         productQuantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         amount:
 *           type: number
 *           format: float
 *           example: 99.99
 *         currency:
 *           type: string
 *           example: USD
 *         status:
 *           $ref: '#/components/schemas/PaymentStatus'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-01-01T12:00:00Z
 *
 *     PaymentInput:
 *       type: object
 *       required:
 *         - orderId
 *         - amount
 *         - status
 *         - productId
 *         - productQuantity
 *       properties:
 *         orderId:
 *           type: string
 *           example: order-456
 *         productId:
 *           type: string
 *           example: product-789
 *         productQuantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         amount:
 *           type: number
 *           format: float
 *           example: 99.99
 *         currency:
 *           type: string
 *           example: USD
 *         status:
 *           $ref: '#/components/schemas/PaymentStatus'
 *
 *     UpdatePaymentStatus:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/PaymentStatus'
 */

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Payment processing and management
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentInput'
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
server.post("/payments", [auth.authenticate(), hasAnyRole('USER', 'ADMIN')], paymentController.create.bind(paymentController));


/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get payment by order ID
 *     tags: [Payments]
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
 *         description: Payment found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Invalid ID parameter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 */

server.get("/payments/:id",[auth.authenticate(), hasAnyRole('USER', 'ADMIN')], paymentController.getByOrderId.bind(paymentController));

/**
 * @swagger
 * /payments/{id}/update:
 *   put:
 *     summary: Update payment status
 *     description: >
 *       Updates payment status.
 *       When status is set to SUCCEEDED, the system:
 *       - Reduces product stock via Product Service
 *       - Sends confirmation email via Notification Service
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/UpdatePaymentStatus'
 *     responses:
 *       202:
 *         description: Payment status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Invalid ID or request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 */
server.put("/payments/:id/update",[auth.authenticate(), hasAnyRole('USER', 'ADMIN')], paymentController.updateStatus.bind(paymentController));

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Retrieve all payments
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 */

server.get("/payments",  paymentController.getAll.bind(paymentController));

/**
 * @swagger
 * /payments/{id}:
 *   delete:
 *     summary: Delete a payment
 *     tags: [Payments]
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
 *       204:
 *         description: Payment deleted successfully
 *       400:
 *         description: Invalid ID parameter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 */
server.delete("/payments/:id", [auth.authenticate(), hasAnyRole('USER', 'ADMIN')], paymentController.delete.bind(paymentController));

server.use(apiErrorHandler);