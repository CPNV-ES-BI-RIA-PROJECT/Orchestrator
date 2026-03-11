import {
  IWorkflowStep,
  StepResult,
} from '../../interfaces/workflow-step.interface';
import { WorkflowContext } from '../../models/workflow-context.model';
import * as clientInterface from '../../../client/interfaces/client.interface';
import { StepConfig } from '../../interfaces/workflow-config.interface';

export class ExtractWorkflowStepService implements IWorkflowStep {
  constructor(
    private readonly config: StepConfig,
    private readonly client: clientInterface.IClient,
  ) {}

  async execute(context: WorkflowContext<unknown>): Promise<StepResult> {
    return await this.client.post(this.config.targetUrl, context.payload);
  }
}
