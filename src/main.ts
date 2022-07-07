import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = 8000;
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(port);

  console.log(`Listening on port ${port}`);
}

bootstrap();
