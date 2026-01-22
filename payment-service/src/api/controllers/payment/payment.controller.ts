import "reflect-metadata";
import { Request, Response } from "express";
import paymentService from "../../../services/payment.service";
import { validateBody, validateParams } from "../../../middleware/validation.middleware";
import { PaymentDto, UpdatePaymentDto } from "../../../types/dto/payment.dto";
import { IdParam } from "../../../types/base.dto";
import { Config } from "../../../config";
import axios from 'axios';

export class PaymentController {

  async create(req: Request, res: Response) {
    const dto = await validateBody(req, PaymentDto);
    const payment = await paymentService.create(dto);
    res.status(201).send(payment);
  }

  async getAll(req: Request, res: Response) {
    const payments = await paymentService.getAll();
    res.status(200).send(payments);
  }

  async getByOrderId(req: Request, res: Response) {
    const { id } = await validateParams(req, IdParam);

    if (typeof id !== "string") {
      res.status(400).send({ error: "Invalid id parameter" });
      return;
    }

    const payment = await paymentService.getByOrderId(id);

    if (payment === null) {
      res.status(404).send();
      return;
    }
    res.status(200).send(payment);
  }

  async updateStatus(req: Request, res: Response) {
    const { id } = await validateParams(req, IdParam);

    if (typeof id !== "string") {
      res.status(400).send({ error: "Invalid id parameter" });
      return;
    }
    const dto = await validateBody(req, UpdatePaymentDto);
    const existingPayment = await paymentService.getByOrderId(id);

    if (existingPayment === null) {
      res.status(404).send();
      return;
    }

    const payment = await paymentService.updateStatus(id, dto);

    if (payment === null) {
      res.status(404).send();
      return;
    }

    if (dto.status === 'SUCCEEDED') {
      const token = req.headers.authorization;
      const userEmail = res.locals.oauth?.token?.user?.email;
      if (token) {
        await this.handleStockReduction(payment.orderId, token, existingPayment.productQuantity);

        await this.handleEmailNotification(payment.orderId, payment.amount, userEmail);
      } else {
        console.warn("Payment succeeded but no token found to update stock.");
      }
    }
    res.status(202).send(payment);

  }

  async delete(req: Request, res: Response) {
    const { id } = await validateParams(req, IdParam);
    if (typeof id !== "string") {
      res.status(400).send({ error: "Invalid id parameter" });
      return;
    }
    const existingPayment = await paymentService.getByOrderId(id);
    if (existingPayment === null) {
      res.status(404).send();
      return;
    }
    await paymentService.delete(id);
    res.status(204).send();
  }
  


  private async handleStockReduction(orderId: string, token: string, quantity: number) {
    try {
      const headers = { Authorization: token };

      const orderResponse = await axios.get(
        `${Config.orderService}/orders/${orderId}`,
        { headers }
      );
      const order = orderResponse.data;

      if (order.products) {
        for (const product of order.products) {

          await axios.put(
            `${Config.productService}/products/${product.productId}/decrease-stock`,
            { quantity: quantity },
            { headers }
          );
        }
      }
      console.log(`Stock updated for Order ${orderId}`);
    } catch (error: any) {
      console.error("Failed to update stock:", error.message);
    }
  }

  private async handleEmailNotification(orderId: string, amount: number, userEmail: string) {
    try {

      await axios.post(`${Config.notificationService}/notify/email`, {
        to: userEmail,
        subject: `Payment Successful - Order #${orderId.slice(-6)}`,
        text: `Hello! Your payment of $${amount} for Order #${orderId} was successful. We are processing your items now.`
      });

    } catch (error: any) {
      console.error("Failed to send email notification:", error.message);
    }
  }


}

export default new PaymentController();