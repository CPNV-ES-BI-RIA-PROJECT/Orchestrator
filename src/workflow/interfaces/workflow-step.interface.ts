import { WorkflowContext } from '../models/workflow-context.model';

export interface StepResult<TData = unknown> {
  isSuccess: boolean;
  data?: TData;
  error?: unknown;
}

export interface IWorkflowStep<TPayload = unknown, TData = unknown> {
  execute(
    context: WorkflowContext<TPayload>,
    currentData: unknown,
  ): Promise<StepResult<TData>>;
}
