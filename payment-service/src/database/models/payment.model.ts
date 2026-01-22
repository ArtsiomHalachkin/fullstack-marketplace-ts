import { ObjectId } from "mongodb";

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
}

export default class Payment {
  public _id?: ObjectId;

  constructor(
    public orderId: string,
    public amount: number,
    public currency: string,
    public status: PaymentStatus = PaymentStatus.PENDING,
    public createdAt: Date = new Date(),
    public productId: string,
    public productQuantity: number
  ) {}
}
