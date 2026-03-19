import {
  IWorkflowStep,
  StepResult,
} from '../../interfaces/workflow-step.interface';
import { WorkflowContext } from '../../models/workflow-context.model';
import * as clientInterface from '../../../client/interfaces/client.interface';
import { StepConfig } from '../../interfaces/workflow-config.interface';

export class TransformWorkflowStepService implements IWorkflowStep {
  constructor(
    private readonly config: StepConfig,
    private readonly client: clientInterface.IClient,
  ) {}

  async execute(
    context: WorkflowContext<unknown>,
    currentData: unknown,
  ): Promise<StepResult<unknown>> {
    try {
      const response = await this.client.post(this.config.targetUrl, {
        url: currentData,
      });

      return {
        isSuccess: true,
        data: response,
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: error,
      };
    }
  }
}
