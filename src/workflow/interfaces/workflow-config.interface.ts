export interface StepConfig {
  type: string;
  targetUrl: string;
}

export interface WorkflowDefinition {
  steps: StepConfig[];
}

export interface WorkflowsConfig {
  etl: WorkflowDefinition;
}
