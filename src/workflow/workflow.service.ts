import { Injectable } from '@nestjs/common';
import { ETLWorkflow } from './strategies/etl-workflow.service';
import { WorkflowContext } from './models/workflow-context.model';
import { WorkflowResult } from './interfaces/workflow.interface';

export interface MyPayload {
  file: Express.Multer.File;
}

@Injectable()
export class WorkflowService {
  constructor(
    private readonly etlWorkflow: ETLWorkflow<MyPayload, WorkflowResult>,
  ) {}

  async startWorkflow(file: Express.Multer.File): Promise<void> {
    const context = new WorkflowContext<MyPayload>('1', { file });

    const result = await this.etlWorkflow.execute(context);

    if (!result.isSuccess) {
      throw new Error(`Workflow failed`);
    }
  }
}
