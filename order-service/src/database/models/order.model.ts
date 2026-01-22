import { ObjectId } from "mongodb";

export enum OrderStatus {
    CREATED = "CREATED",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
      INQUIRY = "INQUIRY"
}

export interface OrderProduct {
    productId: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
}

export interface ChatMessage {
    senderId: string;
    senderRole: string;
    message: string;
    timestamp: Date;
}

export default class Order {

    public _id?: ObjectId; // is optional because MongoDB generates it automatically if you don’t provide one. _is MongoDB convention.

    constructor(
        public userId: string,
        public sellerId: string,
        public products: OrderProduct[],
        public total: number,
        public status: OrderStatus,
        public chatHistory: ChatMessage[] = [],
        public createdAt: Date = new Date()
    ) {}

}