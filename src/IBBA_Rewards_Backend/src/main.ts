import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
// import { CorsOptions } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOptions: CorsOptions = {
    origin: '*',
    credentials: true,
    methods: ['GET,HEAD,PUT,PATCH,POST,DELETE'],
    allowedHeaders: 'Content-Type,Accept,Authorization',
  };

  app.enableCors(corsOptions);

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT_NUMBER);
}
bootstrap();
