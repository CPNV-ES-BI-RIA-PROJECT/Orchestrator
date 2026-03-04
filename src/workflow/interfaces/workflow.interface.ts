import { WorkflowContext } from '../models/workflow-context.model';

export interface WorkflowResult<T = void> {
  isSuccess: boolean;
  data?: T;
  error?: unknown;
}

export interface IWorkflow<TPayload = unknown, TResult = void> {
  execute(context: WorkflowContext<TPayload>): Promise<WorkflowResult<TResult>>;
}
