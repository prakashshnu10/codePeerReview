import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHelloV1(): string {
    return 'Hello from API v1!';
  }

  getHelloV2(): string {
    return 'Hello from API v2!';
  }
}
