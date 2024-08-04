import { Test, TestingModule } from '@nestjs/testing';
import { AnalyzingSwaggerController } from './app/analyzing_swagger.controller';
import { AnalyzingAPIVersioningService } from './app/analyzing_api_versioning.service';

describe('AnalyzingSwaggerController', () => {
  let appController: AnalyzingSwaggerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AnalyzingSwaggerController],
      providers: [AnalyzingAPIVersioningService],
    }).compile();

    appController = app.get<AnalyzingSwaggerController>(AnalyzingSwaggerController);
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
