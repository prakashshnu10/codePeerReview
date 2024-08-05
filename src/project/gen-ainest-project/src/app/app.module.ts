import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyzingAPIVersioningService } from './analyzing.service';
import { AnalyzingSwaggerController } from './analyzing_swagger.controller';

@Module({
  imports: [],
  controllers: [AppController, AnalyzingSwaggerController],
  providers: [AppService, AnalyzingAPIVersioningService],
})
export class AppModule {}
