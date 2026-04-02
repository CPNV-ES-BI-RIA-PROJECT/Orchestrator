import { Inject, Logger } from '@nestjs/common';
import { IWorkflow, WorkflowResult } from '../interfaces/workflow.interface';
import { WorkflowContext } from '../models/workflow-context.model';
import { IWorkflowStep } from '../interfaces/workflow-step.interface';
import { STEPS_TOKEN } from '../workflow.constants';

export class ETLWorkflow<TPayload, TResults> implements IWorkflow<
  TPayload,
  TResults
> {
  private readonly logger = new Logger(ETLWorkflow.name);

  constructor(
    @Inject(STEPS_TOKEN)
    private readonly steps: IWorkflowStep<TPayload>[],
  ) {}

  async execute(
    context: WorkflowContext<TPayload>,
  ): Promise<WorkflowResult<TResults>> {
    let currentData: unknown = context.payload;

    this.logger.log(
      `Starting workflow for job ${context.jobId} with ${this.steps.length} step(s)`,
    );

    for (const [index, step] of this.steps.entries()) {
      const stepNumber = index + 1;
      const stepName = step.constructor.name;

      try {
        this.logger.log(
          `Executing step ${stepNumber}/${this.steps.length}: "${stepName}" for job ${context.jobId}`,
        );
        const result = await step.execute(context, currentData);

        if (!result.isSuccess) {
          this.logger.error(
            `Workflow failed at step ${stepNumber}/${this.steps.length}: "${stepName}" for job ${context.jobId}`,
            result.error instanceof Error ? result.error.stack : undefined,
          );
          return { isSuccess: false, error: result.error };
        }

        currentData = result.data !== undefined ? result.data : currentData;
        this.logger.log(`Received data: ${JSON.stringify(currentData)}`);
        this.logger.log(
          `Finished step ${stepNumber}/${this.steps.length}: "${stepName}" for job ${context.jobId}`,
        );
      } catch (error) {
        this.logger.error(
          `Workflow threw at step ${stepNumber}/${this.steps.length}: "${stepName}" for job ${context.jobId}`,
          error instanceof Error ? error.stack : undefined,
        );
        return { isSuccess: false, error: error };
      }
    }

    this.logger.log(`Workflow completed successfully for job ${context.jobId}`);
    return { isSuccess: true, data: currentData as TResults };
  }
}
