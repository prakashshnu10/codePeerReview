import { Controller, Get,Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get()
  addNumbers(@Query('num1') num1: string, @Query('num2') num2: string): string {
    const sum = this.appService.addNumbers(Number(num1), Number(num2));
    return `The sum of ${num1} and ${num2} is ${sum}`;
  }
}
