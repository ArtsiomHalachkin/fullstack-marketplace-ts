import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import { setupSwagger } from "../swagger";
import notificationController from './controllers/notification/noification.controller';
import { apiErrorHandler } from '../middleware/error.middleware';
import { homepageController } from './controllers/homepage/homepage.controller';

dotenv.config();

export const server = express();
const SWAGGER_PORT = 5005;


server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors({
    origin: process.env.CORS_ORIGIN || '*' 
}));

setupSwagger(server, SWAGGER_PORT, "Notification Service");

/**
 * @swagger
 * components:
 *   schemas:
 *     SendEmailDto:
 *       type: object
 *       required:
 *         - to
 *         - subject
 *         - text
 *       properties:
 *         to:
 *           type: string
 *           format: email
 *           description: Recipient email address
 *           example: user@example.com
 *         subject:
 *           type: string
 *           example: Payment Successful – Order #123456
 *         text:
 *           type: string
 *           example: Your payment was successfully processed.
 *         html:
 *           type: string
 *           description: Optional HTML body
 *           example: "<b>Your payment was successfully processed.</b>"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Validation Failed
 *         details:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - to must be an email
 *             - subject must be a string
 */
/**
 * @swagger
 * tags:
 *   - name: Notification
 *     description: Email notification service
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Service status information
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
 *                   example: Notification Service
 */

server.get("/", homepageController.homepage);

/**
 * @swagger
 * /notify/email:
 *   post:
 *     summary: Send an email notification
 *     description: >
 *       Sends an email using the configured SMTP provider.
 *       Supports plain text and optional HTML content.
 *     tags: [Notification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendEmailDto'
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email sent successfully
 *                 messageId:
 *                   type: string
 *                   example: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Email sending failed (SMTP error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to send email
 */
server.post( '/notify/email', notificationController.sendEmail.bind(notificationController));


server.use(apiErrorHandler);