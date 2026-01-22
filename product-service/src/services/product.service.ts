

import Product from "../database/models/product.model";
import mongo from "../database/mongo";
import { ObjectId } from "mongodb";
import { ProductDto, UpdateProductDto } from "../types/dto/product.dto";
import * as mongodb from "mongodb";
import { DecreaseStockDto } from "../types/dto/product.dto";

export const productService = {
    product_collection: mongo.db!.collection<Product>("products"),

    async create(data: ProductDto, ownerId: string): Promise<Product> {

        const product = new Product(
            data.name,
            data.description,
            data.price,
            data.stockCount,
            ownerId
        );

        await this.product_collection.insertOne(product);
        return product;
    },

    async getAll(): Promise<Product[]> {
        return this.product_collection.find().toArray();
    },

    async getById(id: string): Promise<Product | null> {
        return this.product_collection.findOne({ _id: new ObjectId(id) });
    },

    async getByOwnerId(ownerId: string): Promise<Product[]> {
        return this.product_collection.find({ ownerId: ownerId }).toArray();
    },

    async update(id: string, data: UpdateProductDto): Promise<Product | null> {

        const updateData: { [key: string]: any } = {};

        const protectedFields = ['ownerId', '_id'];

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && !protectedFields.includes(key)) {
                updateData[key] = value;
            }
        });

        if (Object.keys(updateData).length === 0) {
            return this.product_collection.findOne({ _id: new ObjectId(id) });
        }

        return this.product_collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: "after" }
        );
    },


    async decreaseStock(productId: string, dto: DecreaseStockDto): Promise<boolean> {
        const quantity = dto.quantity || 1;
        const result = await this.product_collection.updateOne(
            { _id: new ObjectId(productId), stockCount: { $gte: quantity } },
            { $inc: { stockCount: -quantity } }
        );
        return result.modifiedCount > 0;
    },

    async delete(id: string): Promise<mongodb.DeleteResult> {
        return this.product_collection.deleteOne({ _id: new ObjectId(id) });
    }
}
