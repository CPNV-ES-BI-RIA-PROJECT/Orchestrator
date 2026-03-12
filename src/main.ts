import { NestFactory } from '@nestjs/core';
import { WorkflowModule } from './workflow/workflow.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
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

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
