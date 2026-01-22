import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SendEmailDto {
    @IsNotEmpty()
    @IsEmail({}, { message: "Invalid email format" })
    to!: string;

    @IsNotEmpty()
    @IsString()
    subject!: string;

    @IsNotEmpty()
    @IsString()
    text!: string;

    @IsOptional()
    @IsString()
    html?: string;
}