import { Inject } from '@nestjs/common';
import { IWorkflow, WorkflowResult } from '../interfaces/workflow.interface';
import { WorkflowContext } from '../models/workflow-context.model';
import { IWorkflowStep } from '../interfaces/workflow-step.interface';
import { STEPS_TOKEN } from '../workflow.constants';

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
    let currentData: unknown = context.payload;

    for (const [, step] of this.steps.entries()) {
      try {
        const result = await step.execute(context, currentData);

        if (!result.isSuccess) {
          return { isSuccess: false, error: result.error };
        }

        currentData = result.data !== undefined ? result.data : currentData;
      } catch (error) {
        return { isSuccess: false, error: error };
      }
    }

    return { isSuccess: true, data: currentData as TResults };
  }
}
