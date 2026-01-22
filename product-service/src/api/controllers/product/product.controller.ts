import "reflect-metadata";
import { Request, Response } from "express";
import { productService } from "../../../services/product.service"
import { validateBody, validateParams, validateQuery } from "../../../middleware/validation.middleware";
import { IdParam } from "../../../types/base.dto";
import { ProductDto, UpdateProductDto } from "../../../types/dto/product.dto";
import { DecreaseStockDto } from "../../../types/dto/product.dto";

export class ProductController {

  async getAll(req: Request, res: Response) {
    const products = await productService.getAll();
    res.status(200).send(products);
  }


  async getById(req: Request, res: Response) {
    const { id } = await validateParams(req, IdParam);


    if (typeof id !== "string") {
      res.status(400).send({ error: "Invalid id parameter" });
      return;
    }
    const product = await productService.getById(id);

    if (product === null) {
      res.status(404).send();
      return;
    }

    res.status(200).send(product);
  }

  async getByOwnerId(req: Request, res: Response) {
    const ownerId = res.locals.oauth.token.user.id;

    if (!ownerId) {
      return res.status(401).send({ error: "User ID not found in token" });
    }
    const products = await productService.getByOwnerId(ownerId);
    res.status(200).send(products);
  }

  async create(req: Request, res: Response) {
    const dto = await validateBody(req, ProductDto);

    const ownerId = res.locals.oauth.token.user.id;

    if (!ownerId) {
      return res.status(401).send({ error: "User ID not found in token" });
    }


    const product = await productService.create(dto, ownerId);

    res.status(201).send(product);
  }


  async update(req: Request, res: Response) {
    const { id } = await validateParams(req, IdParam);
    if (typeof id !== "string") {
      res.status(400).send({ error: "Invalid id parameter" });
      return;
    }
    const dto = await validateBody(req, UpdateProductDto);
    const existingProduct = await productService.getById(id);

    if (existingProduct === null) {
      res.status(404).send();
      return;
    }

    const ownerId = res.locals.oauth.token.user.id;

    if (existingProduct.ownerId !== ownerId) {
      return res.status(403).send({ error: "Forbidden: You do not have permission to update this product." });
    }

    const product = await productService.update(id, dto);
    res.status(202).send(product);
  }


  async delete(req: Request, res: Response) {
    const { id } = await validateParams(req, IdParam);

    if (typeof id !== "string") {
      res.status(400).send({ error: "Invalid id parameter" });
      return;
    }

    const existingProduct = await productService.getById(id);

    if (existingProduct === null) {
      res.status(404).send();
      return;
    }

    const currentUserId = res.locals.oauth.token.user.id;

    if (!currentUserId) {
      return res.status(401).send({ error: "User ID not found in token" });
    }

    if (existingProduct.ownerId !== currentUserId) {
      return res.status(403).send({ error: "Forbidden: You do not have permission to delete this product." });
    }

    await productService.delete(id);
    res.status(204).send();
  }

  async decreaseStock(req: Request, res: Response) {
    const { id } = await validateParams(req, IdParam);
    if (typeof id !== "string") {
      res.status(400).send({ error: "Invalid id parameter" });
      return;
    }
    const existingProduct = await productService.getById(id);

    if (existingProduct === null) {
      res.status(404).send();
      return;
    }

    const dto = await validateBody(req, DecreaseStockDto);

    const success = await productService.decreaseStock(id, dto);

    if (success) {
      res.status(200).send({ message: "Stock updated successfully" });
    } else {
      res.status(409).send({ error: "Insufficient stock or product not found" });
    }
  }


}
