import { IsNotEmpty, IsNumber, IsPositive, IsString, Max, Min, IsInt, IsOptional, Length, IsArray, IsEnum, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderStatus {
    CREATED = "CREATED",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
    INQUIRY = "INQUIRY"
}

export enum ChatRole {
    BUYER = "buyer",
    SELLER = "seller",
    SYSTEM = "system"
}


export class OrderDto {

    @IsString()
    @IsNotEmpty()
    userId: string  = "";   

    @IsString()
    @IsNotEmpty()
    sellerId: string  = "";   

    @IsArray()
    @ValidateNested({ each: true }) 
    @Type(() => OrderProductDto)
    @IsNotEmpty({ message: 'Order must contain at least one product.' })
    products: OrderProductDto[] = [];       

    @IsPositive()
    @IsNumber()
    totalPrice: number  = 0;   

    @IsEnum(OrderStatus, { message: 'Status must be one of: CREATED, CONFIRMED, CANCELLED, INQUIRY' })
    @IsNotEmpty()
    status: OrderStatus = OrderStatus.CREATED;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChatMessageDto)
    chatHistory?: ChatMessageDto[] = [];

    @IsOptional()
    @IsDateString()
    createdAt?: Date = new Date();
}

export class OrderProductDto  {

    @IsNotEmpty()
    @IsString()
    productId: string = "";

    @IsString()
    @IsNotEmpty()
    name: string  = "";      

    @IsOptional()
    @IsString()
    description: string = ""; 

    @IsPositive()
    @IsNumber({ maxDecimalPlaces: 2 })
    price: number = 0;       

    //count in order
    @IsPositive()
    @IsInt()
    quantity: number  = 0;   
}           

export class UpdateOrderDto {

    @IsOptional() 
    @IsString()
    @IsNotEmpty()
    orderId?: string;  

    @IsOptional() 
    @IsString()
    @IsNotEmpty()
    userId?: string;  

    @IsOptional() 
    @IsArray()
    @ValidateNested({ each: true }) 
    @Type(() => OrderProductDto)
    products?: OrderProductDto[]; 

    @IsOptional() 
    @IsPositive()
    @IsNumber()
    totalPrice?: number;  

    @IsOptional() 
    @IsEnum(OrderStatus, { message: 'Status must be one of: CREATED, CONFIRMED, CANCELLED' })
    @IsNotEmpty()
    status?: string;    
}


/*
export class InitiateChatDto {
    @IsString()
    @IsNotEmpty()
    productId!: string;
}
*/

export class ChatMessageDto {
    @IsString()
    @IsNotEmpty()
    text: string = "";

    @IsString()
    @IsNotEmpty()
    senderId: string = "";

    @IsEnum(ChatRole)
    role: ChatRole = ChatRole.BUYER;

    @IsDateString()
    timestamp: string = new Date().toISOString();
}