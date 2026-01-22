import type { ChatMessage } from "./ChatMessage";

export interface OrderItem {
  _id: string;
  userId: string;
  sellerId: string;
  products: Array<{
    productId: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
  status: 'CREATED' | 'CONFIRMED' | 'CANCELLED' | 'INQUIRY';
  chatHistory: Array<ChatMessage>;
  createdAt: string;
}