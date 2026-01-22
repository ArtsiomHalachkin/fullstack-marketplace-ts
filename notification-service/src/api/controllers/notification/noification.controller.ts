import { Request, Response } from 'express';
import  { notificationService } from '../../../services/notification.service';
import { validateBody } from '../../../middleware/validation.middleware';
import { SendEmailDto } from '../../../types/dto/notifcation.dto';


export class NotificationController {
    async sendEmail(req: Request, res: Response) {
        const dto  = await validateBody(req, SendEmailDto);
        const info = await notificationService.sendNodeEmail(dto);
        return res.status(200).json({ 
                message: "Email sent successfully",
                messageId: info.messageId
        });
    }
}

export default new NotificationController();