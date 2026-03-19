import { Injectable, Logger } from '@nestjs/common';
import { ETLWorkflow } from './strategies/etl-workflow.service';
import { WorkflowContext } from './models/workflow-context.model';
import { WorkflowResult } from './interfaces/workflow.interface';

export interface Payload {
  fileReference: string;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly etlWorkflow: ETLWorkflow<Payload, WorkflowResult>,
  ) {}

  async startWorkflow(fileReference: string): Promise<void> {
    this.logger.log(
      `Starting workflow process for fileReference: ${fileReference}`,
    );
    const context = new WorkflowContext<Payload>('1', { fileReference });

    const result = await this.etlWorkflow.execute(context);

    if (!result.isSuccess) {
      this.logger.error(
        `Workflow execution failed for fileReference: ${fileReference}`,
        result.error,
      );
      throw new Error(`Workflow failed`);
    }

    this.logger.log(
      `Workflow executed successfully for fileReference: ${fileReference}`,
    );
  }
}
