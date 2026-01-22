import { ObjectId } from "mongodb";
import Payment, { PaymentStatus } from "../database/models/payment.model";
import mongo from "../database/mongo";
import { PaymentDto, UpdatePaymentDto } from "../types/dto/payment.dto";
import { get } from "http";
import * as mongodb from "mongodb";


export const paymentService = {
  payment_collection:  mongo.db!.collection<Payment>("payments"),

  async create(data: PaymentDto) : Promise<Payment> {
    const payment = new Payment(
      data.orderId,
      data.amount,
      data.currency || 'CZK',
      PaymentStatus.PENDING,
      new Date(),
      data.productId,
      data.productQuantity
    ) as any;

    await this.payment_collection.insertOne(payment);
    return payment;
  },

  async getAll(): Promise<Payment[]> {
    return this.payment_collection.find().toArray();
  },

  async getByOrderId(orderId: string): Promise<Payment | null> {
    return this.payment_collection.findOne({ orderId: orderId });
  },

  async getByStatus(status: PaymentStatus): Promise<Payment[]> {
    return this.payment_collection.find({ status: status }).toArray();
  },

  async updateStatus(id: string, status: UpdatePaymentDto): Promise<Payment | null> {
   return await this.payment_collection.findOneAndUpdate(
      { orderId: id }, 
      { $set: { status: status.status } },
      { returnDocument: "after" }
    );
  },

  async delete(id: string): Promise<mongodb.DeleteResult> {
    return this.payment_collection.deleteOne({ _id: new ObjectId(id) });
  }

};

export default paymentService;
