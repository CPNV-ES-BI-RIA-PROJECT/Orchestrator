import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [ClientModule],
  controllers: [WorkflowController],
  providers: [WorkflowService],
})
export class WorkflowModule {}
