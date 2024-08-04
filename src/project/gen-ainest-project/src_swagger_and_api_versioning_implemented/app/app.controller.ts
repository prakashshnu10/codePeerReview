import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiTags('v1')
  @Get('v1/hello')
  getHelloV1(): string {
    return this.appService.getHelloV1();
  }

  @ApiTags('v2')
  @Get('v2/hello')
  getHelloV2(): string {
    return this.appService.getHelloV2();
  }
}
