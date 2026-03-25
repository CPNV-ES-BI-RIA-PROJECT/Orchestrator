import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkflowModule } from './workflow/workflow.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(WorkflowModule, { bufferLogs: true });
  app.useLogger(logger);
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Orchestrator Service API')
    .setDescription('The API description for the orchestrator of an ETL')
    .setVersion('0.1.0')
    .addTag('workflow')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1', app, document);

  const port = process.env.PORT ?? 3000;

  await app.listen(port);
  logger.log(`Application started on port ${port}`);
  logger.log(`Swagger UI available at /api/v1`);
}
void bootstrap();
