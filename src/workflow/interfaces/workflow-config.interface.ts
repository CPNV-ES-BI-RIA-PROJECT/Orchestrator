export interface StepConfig {
  type: string;
  target: string;
}

export interface WorkflowDefinition {
  steps: StepConfig[];
}

export interface WorkflowsConfig {
  etl: WorkflowDefinition;
}
