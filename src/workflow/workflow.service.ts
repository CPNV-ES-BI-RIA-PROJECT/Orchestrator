import { Injectable } from '@nestjs/common';
import { ETLWorkflow } from './strategies/etl-workflow.service';
import { WorkflowContext } from './models/workflow-context.model';
import { WorkflowResult } from './interfaces/workflow.interface';

export interface Payload {
  fileReference: string;
}

@Injectable()
export class WorkflowService {
  constructor(
    private readonly etlWorkflow: ETLWorkflow<Payload, WorkflowResult>,
  ) {}

  async startWorkflow(fileReference: string): Promise<void> {
    const context = new WorkflowContext<Payload>('1', { fileReference });

    const result = await this.etlWorkflow.execute(context);

    if (!result.isSuccess) {
      throw new Error(`Workflow failed`);
    }
  }
}
