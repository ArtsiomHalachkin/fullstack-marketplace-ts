import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from '../request';
import { notificationService } from '../../src/services/notification.service';

// Mock the Dependency
// We mock the notificationService so we don't send real emails during testing.
vi.mock('../../../services/notification.service', () => ({
  notificationService: {
    sendNodeEmail: vi.fn(),
  },
}));

describe('Notification Service API', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /notify/email', () => {

    const validPayload = {
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'This is a test email content',
      html: '<p>This is a test</p>'
    };

    it('should return 200 when email is sent successfully', async () => {
     

      const sendEmailSpy = vi.spyOn(notificationService, 'sendNodeEmail')
        .mockResolvedValue({
          messageId: '<12345-mock-id@example.com>',
          accepted: ['test@example.com'],
          rejected: [],
          envelopeTime: 10,
          messageTime: 10,
          messageSize: 10,
          response: '250 OK'
        });

      const res = await request
        .post('/notify/email')
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Email sent successfully",
        messageId: '<12345-mock-id@example.com>'
      });


      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: validPayload.to,
          subject: validPayload.subject
        })
      );
    });

    it('should return 400 if the email format is invalid', async () => {
      const invalidPayload = { ...validPayload, to: 'not-an-email' };

      const res = await request
        .post('/notify/email')
        .send(invalidPayload);

      expect(res.status).toBe(400);
    });

    it('should return 400 if required fields are missing', async () => {
      const { subject, ...missingSubjectPayload } = validPayload;

      const res = await request
        .post('/notify/email')
        .send(missingSubjectPayload);

      expect(res.status).toBe(400);
    });

    it('should return 500 if the notification service fails', async () => {

      vi.spyOn(notificationService, 'sendNodeEmail')
        .mockRejectedValue(new Error('SMTP Error'));

      const res = await request
        .post('/notify/email')
        .send(validPayload);

      expect(res.status).toBe(500);
    });

  });
});