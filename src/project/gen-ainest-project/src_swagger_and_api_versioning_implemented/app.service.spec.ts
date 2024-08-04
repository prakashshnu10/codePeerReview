import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app/app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should return "Hello from API v1!"', () => {
    expect(service.getHelloV1()).toBe('Hello from API v1!');
  });

  it('should return "Hello from API v2!"', () => {
    expect(service.getHelloV2()).toBe('Hello from API v2!');
  });
});
