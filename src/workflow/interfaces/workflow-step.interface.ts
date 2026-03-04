import { WorkflowContext } from '../models/workflow-context.model';

export interface StepResult {
  isSuccess: boolean;
  error?: unknown;
}

export interface IWorkflowStep<TPayload = unknown> {
  execute(context: WorkflowContext<TPayload>): Promise<StepResult>;
}
