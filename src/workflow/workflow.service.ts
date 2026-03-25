import { Injectable, Logger } from '@nestjs/common';
import { ETLWorkflow } from './strategies/etl-workflow.service';
import { WorkflowContext } from './models/workflow-context.model';
import { WorkflowResult } from './interfaces/workflow.interface';

export interface Payload {
  url: string;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly etlWorkflow: ETLWorkflow<Payload, WorkflowResult>,
  ) {}

  async startWorkflow(url: string): Promise<void> {
    const context = new WorkflowContext<Payload>('1', { url });
    this.logger.log(`Triggering workflow for job ${context.jobId}`);

    const result = await this.etlWorkflow.execute(context);

    if (!result.isSuccess) {
      this.logger.error(`Workflow failed for job ${context.jobId}`);
      throw new Error(`Workflow failed`);
    }

    this.logger.log(`Workflow finished for job ${context.jobId}`);
  }
}
