export interface StepConfig {
  type: string;
  targetUrl: string;
}

export interface WorkflowConfig {
  steps: StepConfig[];
}
