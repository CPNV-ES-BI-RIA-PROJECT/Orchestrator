import { Injectable, Inject } from '@nestjs/common';
import { IWorkflow, WorkflowResult } from '../interfaces/workflow.interface';
import { WorkflowContext } from '../models/workflow-context.model';
import { IWorkflowStep } from '../interfaces/workflow-step.interface';
import { STEPS_TOKEN } from '../workflow.constants';

@Injectable()
export class ETLWorkflow<TPayload, TResults> implements IWorkflow<
  TPayload,
  TResults
> {
  constructor(
    @Inject(STEPS_TOKEN)
    private readonly steps: IWorkflowStep<TPayload>[],
  ) {}

  async execute(
    context: WorkflowContext<TPayload>,
  ): Promise<WorkflowResult<TResults>> {
    for (const [, step] of this.steps.entries()) {
      try {
        const result = await step.execute(context);

        if (!result.isSuccess) {
          return { isSuccess: false, error: result.error };
        }
      } catch (error) {
        return { isSuccess: false, error: error };
      }
    }

    return { isSuccess: true };
  }
}
