import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ClientModule } from '../client/client.module';
import { ETLWorkflow } from './strategies/etl-workflow.service';
import { ExtractWorkflowStepService } from './strategies/steps/extract-workflow-step.service';
import { STEPS_TOKEN } from './workflow.constants';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ClientModule, ConfigModule.forRoot()],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    ETLWorkflow,
    ExtractWorkflowStepService,
    {
      provide: STEPS_TOKEN,
      useFactory: (extract: ExtractWorkflowStepService) => {
        return [extract];
      },
      inject: [ExtractWorkflowStepService],
    },
  ],
})
export class WorkflowModule {}
