import { Test, TestingModule } from '@nestjs/testing';
import { AnalyzingAPIVersioningService } from './app/analyzing.service';

describe('AnalyzingAPIVersioningService', () => {
  let service: AnalyzingAPIVersioningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyzingAPIVersioningService],
    }).compile();

    service = module.get<AnalyzingAPIVersioningService>(AnalyzingAPIVersioningService);
  });

  it('should return "Hello from API v1!"', () => {
    expect(service.getHelloV1()).toBe('Hello from API v1!');
  });


});
