import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHelloV1', () => {
    it('should return "Hello from API v1!"', () => {
      expect(appController.getHelloV1()).toBe('Hello from API v1!');
    });
  });

  describe('getHelloV2', () => {
    it('should return "Hello from API v2!"', () => {
      expect(appController.getHelloV2()).toBe('Hello from API v2!');
    });
  });
});
