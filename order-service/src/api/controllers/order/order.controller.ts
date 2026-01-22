import "reflect-metadata";
import { Request, Response } from "express";
import { orderService } from "../../../services/order.service";
import { validateBody, validateParams } from "../../../middleware/validation.middleware";
import { IdParam, UserIdParam } from "../../../types/base.dto"; 
import { 
    OrderDto, 
    UpdateOrderDto,
    OrderStatus
} from "../../../types/dto/order.dto"; 
import { Config } from "../../../config";

export class OrderController {

    async initiateChat(req: Request, res: Response) {
        const { id } =  await validateParams(req, IdParam);

      
        const userId = res.locals.oauth.token.user.id; 


        if(typeof id !== "string") {
            res.status(400).send({ error: "Invalid product ID parameter" });
            return 
        }

        if (!userId) {
            res.status(401).send({ error: "Unauthorized: No userId ID found" });
            return 
        }

        const productResponse = await fetch(`${Config.productService}/products/${id}`);

        if (productResponse.status === 404) {
            res.status(404).send({ error: "Product not found" });
            return;
        }

        if (!productResponse.ok) {
            res.status(502).send({ error: "Failed to fetch product details from Product Service" });
            return;
        }


        const product = await productResponse.json();


        const chatRoom = await orderService.getOrCreateInquiry(product, userId, 1);

        if (!chatRoom) {
            res.status(500).send({ error: "Failed to create or retrieve inquiry chat room" });
            return;
        }

        res.status(200).send(chatRoom);
    }

    async getAll(req: Request, res: Response) {
        const orders = await orderService.getAll(); 
        res.status(200).send(orders);
    }

    async getById(req: Request, res: Response) {
        const { id } = await validateParams(req, UserIdParam);

        if (typeof id !== "string") {
            res.status(400).send({ error: "Invalid id parameter" }); 
            return;
        }
        
        const order = await orderService.getById(id); 

        if (order === null) {
            res.status(404).send(); 
            return;
        }

        res.status(200).send(order);
    }

    async getByUserId(req: Request, res: Response) {
        const { id } = await validateParams(req, UserIdParam);
        if (typeof id !== "string") {
            res.status(400).send({ error: "Invalid userId parameter" });
            return;
        }
        const orders = await orderService.getByUserId(id);
        res.status(200).send(orders);
    }

    async getBySellerId(req: Request, res: Response) {
        const { id } = await validateParams(req, UserIdParam);
        if (typeof id !== "string") {
            res.status(400).send({ error: "Invalid sellerId parameter" });
            return;
        }
        const orders = await orderService.getBySellerId(id);
        res.status(200).send(orders);
    }

    async create(req: Request, res: Response) {
        const dto = await validateBody(req, OrderDto); 
        const order = await orderService.create(dto); 
        res.status(201).send(order);
    }

    async update(req: Request, res: Response) {
        const { id } = await validateParams(req, IdParam);
        if (typeof id !== "string") {
            res.status(400).send({ error: "Invalid id parameter" });
            return;
        }
        
        const dto = await validateBody(req, UpdateOrderDto); 
        const existingOrder = await orderService.getById(id); 

        if (existingOrder === null) {
            res.status(404).send();
            return;
        }

        const order = await orderService.update(id, dto); 
        res.status(202).send(order);
    }

    
    async delete(req: Request, res: Response) {
        const { id } = await validateParams(req, IdParam);
        if (typeof id !== "string") {
            res.status(400).send({ error: "Invalid id parameter" });
            return;
        }

        const existingOrder = await orderService.getById(id); 
        
        if (existingOrder === null) {
            res.status(404).send();
            return;
        }

        await orderService.delete(id); 
        res.status(204).send();
    }
}