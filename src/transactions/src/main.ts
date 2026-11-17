import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('./localhost+2-key.pem'),
    cert: fs.readFileSync('./localhost+2.pem')
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
