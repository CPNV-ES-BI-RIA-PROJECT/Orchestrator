import { NestFactory } from '@nestjs/core';
import { WorkflowModule } from './workflow/workflow.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkflowModule);
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
