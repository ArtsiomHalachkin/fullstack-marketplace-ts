import {homepageController} from "./controllers/homepage/homepage.controller";
import {apiErrorHandler} from "../middleware/error.middleware";
import {ProductController} from "./controllers/product/product.controller"
import express from "express";
import cors from "cors";
import {hasAnyRole, oAuthModel} from "../middleware/auth.middleware";
import ExpresOAuthServer from '@node-oauth/express-oauth-server';
import { setupSwagger } from "../swagger"
import mongo from "../database/mongo";

export const server = express();

const port = 5002;

setupSwagger(server, port, "Product Service");

(async () => {
  await mongo.connect();
})();

// Middleware to parse JSON and URL-encoded data
server.use(express.json());
server.use(express.urlencoded({ extended: true }))

const auth = new ExpresOAuthServer({ model: oAuthModel as any });

server.use(cors({
  origin: process.env.CORS_ORIGIN
}))



/**
 * @swagger
 * /:
 *   get:
 *     summary:  Health check
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
 *                   example: Product Service
 */
server.get("/", homepageController.homepage);

const productController = new ProductController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the product
 *         name:
 *           type: string
 *           example: Gaming Mouse
 *         price:
 *           type: number
 *           format: float
 *           example: 49.99
 *         description:
 *           type: string
 *           example: High DPI optical mouse
 *         stockCount:
 *           type: integer
 *           example: 12
 *         ownerId:
 *           type: string
 *           example: user-123
 *
 *     ProductInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - description
 *         - stockCount
 *         - ownerId
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           example: Gaming Mouse
 *         price:
 *           type: number
 *           format: float
 *           example: 49.99
 *         description:
 *           type: string
 *           example: High DPI optical mouse
 *         stockCount:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           example: 12
 *         ownerId:
 *           type: string
 *           example: user-123
 *
 *     DecreaseStockDto:
 *       type: object
 *       description: Payload used to decrease product stock
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Amount by which the product stock should be decreased
 *           example: 1
 */

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product catalog management
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Retrieve a list of products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
server.get("/products", productController.getAll.bind(productController));

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The product ID
 *     responses:
 *       200:
 *         description: The product data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid ID format (e.g., malformed ID)
 *       404:
 *         description: Product not found (ID does not exist)
 */
server.get("/products/:id", productController.getById.bind(productController));

/**
 * @swagger
 * /products/owner/me:
 *   get:
 *     summary: Get products for the authenticated owner
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products for the owner
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized (User ID not found in token or token missing)
 *       403:
 *         description: Forbidden (User does not have required role)
 */
server.get("/products/owner/me", [auth.authenticate(), hasAnyRole('USER', 'ADMIN')], productController.getByOwnerId.bind(productController));

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: The created product 
 *         content:
 *           application/json:  
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid product data
 *       401:
 *         description: Unauthorized (User ID not found in token or token missing)
 *       403:
 *         description: Forbidden (User does not have required role)
 */
server.post("/products", [auth.authenticate(), hasAnyRole('USER', 'ADMIN')], productController.create.bind(productController));

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update an existing product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductDto'
 *     responses:
 *       202:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid ID parameter (e.g., malformed ID)
 *       401:
 *         description: Unauthorized (User ID not found in token or token missing)
 *       403:
 *         description: Forbidden (You do not have permission to update this product.)
 *       404:
 *         description: Product not found (ID does not exist)
 */
server.put("/products/:id", [auth.authenticate(), hasAnyRole('USER', 'ADMIN')], productController.update.bind(productController));

/**
 * @swagger
 * /products/{id}/decrease-stock:
 *   put:
 *     summary: Decrease product stock
 *     description: >
 *       Decreases the stock count of a product by the specified quantity.
 *       If quantity is not provided, the service applies its default logic.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DecreaseStockDto'
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockUpdateResponse'
 *       400:
 *         description: Invalid product ID parameter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 *       409:
 *         description: Insufficient stock or product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
server.put("/products/:id/decrease-stock", [auth.authenticate(), hasAnyRole('USER', 'ADMIN')], productController.decreaseStock.bind(productController));

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted successfully (No Content)
 *       400:
 *         description: Invalid ID parameter (e.g., malformed ID)
 *       401:
 *         description: Unauthorized (User ID not found in token or token missing)
 *       403:
 *         description: Forbidden (You do not have permission to delete this product.)
 *       404:
 *         description: Product not found (ID does not exist)
 */
server.delete("/products/:id", [auth.authenticate(), hasAnyRole('USER', 'ADMIN')], productController.delete.bind(productController));

// Middleware: Error handling
server.use(apiErrorHandler);