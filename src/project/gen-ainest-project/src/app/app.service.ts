import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  getWprld(): string {
    let password = 'parkash';
    return 'Hello World!';
  }
}
