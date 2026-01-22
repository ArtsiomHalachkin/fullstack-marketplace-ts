import { Send } from 'express';
import nodemailer from 'nodemailer';
import { SendEmailDto } from '../types/dto/notifcation.dto';
import { SentMessageInfo } from 'nodemailer';

export const notificationService = {
    transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 2525,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    }),

    async sendNodeEmail(dto: SendEmailDto): Promise<SentMessageInfo> {
        return await this.transporter.sendMail({
            from: '"GGG Marketplace" <no-reply@gggmarketplace.com>',
            to: dto.to,
            subject: dto.subject,
            text: dto.text,
            html: dto.html || `<b>${dto.text}</b>`
        });
    }
}
export default notificationService;