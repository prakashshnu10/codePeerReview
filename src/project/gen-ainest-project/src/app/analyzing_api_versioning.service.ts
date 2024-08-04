import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyzingAPIVersioningService {
  getHelloV1(): string {
    return 'Hello from API v1!';
  }

  getHelloV2(): string {
    return 'Hello from API v2!';
  }
}
