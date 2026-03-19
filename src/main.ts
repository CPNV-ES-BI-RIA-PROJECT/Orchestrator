import { NestFactory } from '@nestjs/core';
import { WorkflowModule } from './workflow/workflow.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(WorkflowModule);
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

  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(
    `Swagger documentation available at: http://localhost:${port}/api/v1`,
  );
}
void bootstrap();
