import { MqttWorkflowStepService } from './strategies/steps/mqtt-workflow-step.service';
import { HttpWorkflowStepService } from './strategies/steps/http-workflow-step.service';
import { MqttExtractWorkflowStepService } from './strategies/steps/mqtt-extract-workflow-step.service';

export const STEPS_TOKEN = Symbol('STEPS_TOKEN');

export const StepStrategies = {
  http: {
    extract: HttpWorkflowStepService,
    transform: HttpWorkflowStepService,
    load: HttpWorkflowStepService,
    default: HttpWorkflowStepService,
  },
  mqtt: {
    extract: MqttExtractWorkflowStepService,
    transform: MqttWorkflowStepService,
    load: MqttWorkflowStepService,
    default: MqttWorkflowStepService,
  },
};
