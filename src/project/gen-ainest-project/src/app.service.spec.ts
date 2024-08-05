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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return "Hello World!"', () => {
    expect(service.getHello()).toBe('Hello World!');
  });

  it('should return "Hello World!"', () => {
    expect(service.getWorld()).toBe('Hello World!');
  });

  it('should add two numbers correctly', () => {
    expect(service.addNumbers(2, 3)).toBe(5);
    expect(service.addNumbers(-2, 3)).toBe(1);
    expect(service.addNumbers(2, -3)).toBe(-1);
    expect(service.addNumbers(0, 0)).toBe(0);
  });
});
