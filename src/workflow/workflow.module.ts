import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ClientModule } from '../client/client.module';
import { ETLWorkflow } from './strategies/etl-workflow.service';
import { ExtractWorkflowStepService } from './strategies/steps/extract-workflow-step.service';
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
    ExtractWorkflowStepService,
    {
      provide: STEPS_TOKEN,
      useFactory: (configService: ConfigService, client: IClient) => {
        const config = configService.get<WorkflowConfig>('workflow');
        const steps: IWorkflowStep<unknown>[] = [];

        if (config && config.steps) {
          for (const stepConfig of config.steps) {
            if (stepConfig.type === 'extract') {
              steps.push(new ExtractWorkflowStepService(stepConfig, client));
            }
          }
        }

        return steps;
      },
      inject: [ConfigService, CLIENT_TOKEN],
    },
  ],
})
export class WorkflowModule {}
