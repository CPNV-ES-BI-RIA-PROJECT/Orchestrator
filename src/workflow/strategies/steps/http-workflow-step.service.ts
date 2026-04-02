import { Logger } from '@nestjs/common';
import {
  IWorkflowStep,
  StepResult,
} from '../../interfaces/workflow-step.interface';
import { WorkflowContext } from '../../models/workflow-context.model';
import * as clientInterface from '../../../client/interfaces/client.interface';
import { StepConfig } from '../../interfaces/workflow-config.interface';

export class HttpWorkflowStepService implements IWorkflowStep {
  private readonly logger = new Logger(HttpWorkflowStepService.name);

  constructor(
    private readonly config: StepConfig,
    private readonly client: clientInterface.IClient,
  ) {}

  async execute(
    context: WorkflowContext<unknown>,
    currentData: { url: string },
  ): Promise<StepResult<unknown>> {
    try {
      this.logger.log(
        `Starting "${this.config.type}" step for job ${context.jobId} -> ${this.config.target}`,
      );
      const response = await this.client.dispatch(
        this.config.target,
        currentData,
      );
      this.logger.log(
        `Completed "${this.config.type}" step for job ${context.jobId}`,
      );

      return {
        isSuccess: true,
        data: response,
      };
    } catch (error) {
      this.logger.error(
        `Failed "${this.config.type}" step for job ${context.jobId}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        isSuccess: false,
        error: error,
      };
    }
  }
}
