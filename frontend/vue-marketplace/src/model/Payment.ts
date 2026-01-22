export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
}

export interface Payment {
  _id?: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus
  createdAt?: Date;
  productId: string;
  productQuantity: number;
}