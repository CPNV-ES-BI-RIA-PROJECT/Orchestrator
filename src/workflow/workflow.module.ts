import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ClientModule } from '../client/client.module';
import { ETLWorkflow } from './strategies/etl-workflow.service';
import { HttpWorkflowStepService } from './strategies/steps/http-workflow-step.service';
import { STEPS_TOKEN } from './workflow.constants';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WorkflowConfig } from './interfaces/workflow-config.interface';
import { IClient } from '../client/interfaces/client.interface';
import { CLIENT_TOKEN } from '../client/client.constants';
import { IWorkflowStep } from './interfaces/workflow-step.interface';
import workflowConfig from './config/workflow.config';

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
        const config = configService.get<WorkflowConfig>('workflow');
        const stepsConfig = config?.steps ?? [];

        return stepsConfig.map((stepConfig) => {
          switch (stepConfig.type) {
            case 'extract':
            case 'transform':
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
