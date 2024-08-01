import { TelegramNotificationService } from './telegram-notification.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('TelegramNotificationService', () => {
  let telegramService;

  beforeEach(() => {
    telegramService = new TelegramNotificationService();
  });

  it('should send a notification successfully', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      status: 200,
      text: jest.fn().mockResolvedValue('Notification sent successfully'),
    });

    global.fetch = mockFetch;

    const result = await telegramService.sendNotification('Test message');

    expect(result).toEqual({
      Status: 'Notification successfully sent to admin',
      Message: 'Test message',
    });
  });

  it('should throw UNAUTHORIZED error for incorrect bot token', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      status: 401,
      text: jest.fn().mockResolvedValue('Unauthorized'),
    });

    global.fetch = mockFetch;

    try {
      await telegramService.sendNotification('Test message');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.getResponse()).toEqual({
        Status: HttpStatus.UNAUTHORIZED,
        Error: 'Bot token is not correct!',
      });
    }
  });

  it('should throw BAD_REQUEST error for incorrect chat id', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      status: 400,
      text: jest.fn().mockResolvedValue('Bad Request'),
    });

    global.fetch = mockFetch;

    try {
      await telegramService.sendNotification('Test message');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.getResponse()).toEqual({
        Status: HttpStatus.BAD_REQUEST,
        Error: 'Chat Id is not correct!',
      });
    }
  });

  it('should throw an error for other status codes', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      status: 500,
      text: jest.fn().mockResolvedValue('Internal Server Error'),
    });

    global.fetch = mockFetch;

    try {
      await telegramService.sendNotification('Test message');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.getResponse()).toEqual({
        Status: HttpStatus.INTERNAL_SERVER_ERROR,
        Error: 'Internal Server Error',
      });
    }
  });

  it('should handle network errors and re-throw them', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));

    global.fetch = mockFetch;

    try {
      await telegramService.sendNotification('Test message');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Network error');
    }
  });
});
