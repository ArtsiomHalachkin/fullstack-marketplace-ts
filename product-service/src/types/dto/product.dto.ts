import { IsNotEmpty, IsNumber, IsPositive, IsString, Max, Min, IsInt, IsOptional, Length } from 'class-validator';

// Data Transfer Object (DTO) for Product
// Used for validating and transferring product data between client and server.
// Created via plainToInstance() in validation middleware.

export class ProductDto {


    @IsNotEmpty()
    @IsString()
    @Length(3, 50)
    name: string = "";

    @IsOptional()
    @IsString()
    description: string = "";

    @IsNotEmpty()
    @IsPositive()
    @IsNumber({maxDecimalPlaces: 2})
    price: number = 0;

    @IsNotEmpty()
    @Min(0)
    @Max(100)
    stockCount: number = 0;

    @IsNotEmpty()
    @IsString()
    ownerId: string = "";
}

export class UpdateProductDto {
    @IsOptional() 
    @IsString()
    @Length(3, 50)
    name?: string; 

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional() 
    @IsPositive()
    @IsNumber({ maxDecimalPlaces: 2 })
    price?: number; 

    @IsOptional() 
    @Min(0)
    @Max(100)
    stockCount?: number; 

    @IsOptional() 
    @IsString()
    ownerId?: string = "";
}

export class DecreaseStockDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    quantity?: number;
}