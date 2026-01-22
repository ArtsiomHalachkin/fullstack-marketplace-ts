import { ObjectId } from "mongodb";

export default class Product {

    public _id?: ObjectId; 

    constructor(
        public name: string,
        public description: string,
        public price: number,
        public stockCount: number,
        public ownerId: string 
    ) {}

}