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
    this.logger.debug(
      `Executing ETL Workflow for context ID: ${context.correlationId}`,
    );
    let currentData: unknown = context.payload;

    for (const [index, step] of this.steps.entries()) {
      const stepName = step.constructor.name || `Step ${index}`;
      this.logger.debug(`Starting execution of step [${index}]: ${stepName}`);

      try {
        const result = await step.execute(context, currentData);

        if (!result.isSuccess) {
          this.logger.warn(
            `Step [${index}]: ${stepName} reported failure. Halting workflow.`,
          );
          return { isSuccess: false, error: result.error };
        }

        currentData = result.data !== undefined ? result.data : currentData;
        this.logger.debug(
          `Successfully completed step [${index}]: ${stepName}`,
        );
      } catch (error) {
        this.logger.error(
          `Exception caught during step [${index}]: ${stepName}`,
          error instanceof Error ? error.stack : String(error),
        );
        return { isSuccess: false, error: error };
      }
    }

    this.logger.debug(`ETL Workflow completed all steps successfully.`);
    return { isSuccess: true, data: currentData as TResults };
  }
}
