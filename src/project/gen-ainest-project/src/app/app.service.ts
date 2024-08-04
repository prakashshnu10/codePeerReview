import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  getWprld(): string {
    let password="abcd";
    return 'Hello World!';
  }
}
