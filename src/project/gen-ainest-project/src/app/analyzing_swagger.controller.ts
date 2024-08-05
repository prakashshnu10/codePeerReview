import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyzingAPIVersioningService } from './analyzing.service';

@Controller('api')
export class AnalyzingSwaggerController {
  constructor(private readonly appService: AnalyzingAPIVersioningService) {}

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
