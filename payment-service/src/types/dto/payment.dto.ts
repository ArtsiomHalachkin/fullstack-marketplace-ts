import { IsNotEmpty, IsNumber, IsPositive, IsString, IsOptional, IsEnum, IsDate } from "class-validator";
import { PaymentStatus } from "../../database/models/payment.model";



export class PaymentDto {
  
  @IsNotEmpty()
  @IsString()
  orderId!: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @IsNotEmpty()
  @IsString()
  productId: string = "";

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  productQuantity: number = 0;

}

export class UpdatePaymentDto {
  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;
}

