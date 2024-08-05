import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  getWorld(): string {
    return 'Hello World!';
  }

  addNumbers(num1: number, num2: number): number {
    return num1 + num2;
  }



}
