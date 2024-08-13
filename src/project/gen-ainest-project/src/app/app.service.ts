import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  getWorld(): string {
    return 'Hello World!';
  }

  getWorld_2(): string {
    return 'Hello World! 2';
  }





}
