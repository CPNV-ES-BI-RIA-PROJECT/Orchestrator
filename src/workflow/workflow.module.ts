import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ClientModule } from '../client/client.module';
import { ETLWorkflow } from './strategies/etl-workflow.service';
import { HttpWorkflowStepService } from './strategies/steps/http-workflow-step.service';
import { STEPS_TOKEN } from './workflow.constants';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WorkflowsConfig } from './interfaces/workflow-config.interface';
import { IClient } from '../client/interfaces/client.interface';
import { CLIENT_TOKEN } from '../client/client.constants';
import workflowConfig from './config/workflow.config';
import { ExtractWorkflowStepService } from './strategies/steps/extract-workflow-step.service';
import { TransformWorkflowStepService } from './strategies/steps/transform-workflow-step.service';

@Module({
  imports: [ClientModule, ConfigModule.forRoot({ load: [workflowConfig] })],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    ETLWorkflow,
    {
      provide: STEPS_TOKEN,
      inject: [ConfigService, CLIENT_TOKEN],
      useFactory: (configService: ConfigService, client: IClient) => {
        const workflowsConfig = configService.get<WorkflowsConfig>('workflows');
        const etlStepsConfig = workflowsConfig?.etl?.steps ?? [];

        return etlStepsConfig.map((stepConfig) => {
          switch (stepConfig.type) {
            case 'extract':
              return new ExtractWorkflowStepService(stepConfig, client);
            case 'transform':
              return new TransformWorkflowStepService(stepConfig, client);
            case 'load':
            default:
              return new HttpWorkflowStepService(stepConfig, client);
          }
        });
      },
    },
  ],
})
export class WorkflowModule {}
