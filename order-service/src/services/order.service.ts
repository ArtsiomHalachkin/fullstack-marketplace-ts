import Order from "../database/models/order.model";
import mongo from "../database/mongo";
import { ObjectId } from "mongodb";
import { OrderDto, UpdateOrderDto, ChatMessageDto, OrderProductDto } from "../types/dto/order.dto";
import * as mongodb from "mongodb";
import { Config}  from "../config"
import { ProductDto } from "../../../product-service/src/types/dto/product.dto";
import { OrderStatus } from "../types/dto/order.dto";

export const orderService = {
    order_collection: mongo.db!.collection<Order>("orders"), 

    async getOrCreateInquiry(data: any, userId: string, quantity: number) {

        if (!data._id) {
            console.error("Product ID is missing in the provided data.");
            return null;
        }

        
        const chatRoom = await this.order_collection.findOne({
            sellerId: data.ownerId,
            products: { $elemMatch: { productId: data._id.toString() } },
            status: OrderStatus.INQUIRY,
        });

        if (chatRoom) {
            console.log("Found existing chat room:", chatRoom._id);
            return chatRoom;
        }
        
        const orderProduct = {
            productId: data._id.toString(),
            name: data.name,
            description: data.description,
            price: data.price,
            quantity: quantity
        }

        const newChatOrder = new Order(
            userId,
            data.ownerId,
            [orderProduct],
            data.price,
            OrderStatus.INQUIRY,
            [],
            new Date()
        );

        await this.order_collection.insertOne(newChatOrder);
        return newChatOrder;
        
    },

    async create(data: OrderDto): Promise<Order> {
       
        const order = new Order(data.userId, data.userId, data.products, data.totalPrice, data.status); 
        await this.order_collection.insertOne(order); 
        return order
    },

    async getAll(): Promise<Order[]> {
        return this.order_collection.find().toArray();
    },

    async getById(id: string): Promise<Order | null> {
        return this.order_collection.findOne({ _id: new ObjectId(id) });
    },

    async getByUserId(userId: string): Promise<Order[]> {
        return this.order_collection.find({ userId: userId }).toArray();
    },

    async getBySellerId(sellerId: string): Promise<Order[]> {
        return this.order_collection.find({ sellerId: sellerId }).toArray();
    },

    async update(id: string, data: UpdateOrderDto): Promise<Order | null> {
        const updateData: { [key: string]: any } = {};

        Object.entries(data).forEach(([key, value]) => {
            if(value != undefined){
                updateData[key] = value
            }
        });

        return this.order_collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: "after" }
        );
    },

    async delete(id: string): Promise<mongodb.DeleteResult> {
        return this.order_collection.deleteOne({ _id: new ObjectId(id) });
    },

   async addMessageToOrder(orderId: string, message: ChatMessageDto): Promise<void> {
        await this.order_collection.updateOne(
            { _id: new ObjectId(orderId) },
            { $push: { chatHistory: message } as any }
        );
    },
    

    
}