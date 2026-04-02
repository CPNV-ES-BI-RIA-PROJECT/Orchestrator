import { Logger } from '@nestjs/common';
import {
  IWorkflowStep,
  StepResult,
} from '../../interfaces/workflow-step.interface';
import { WorkflowContext } from '../../models/workflow-context.model';
import * as clientInterface from '../../../client/interfaces/client.interface';
import { StepConfig } from '../../interfaces/workflow-config.interface';
import { MqttEventPayload } from '../../../client/mqtt/mqtt.service';

export class MqttWorkflowStepService implements IWorkflowStep {
  private readonly logger = new Logger(MqttWorkflowStepService.name);

  constructor(
    private readonly config: StepConfig,
    private readonly client: clientInterface.IClient,
  ) {}

  async execute(
    context: WorkflowContext<unknown>,
    currentData: { uri: string },
  ): Promise<StepResult<unknown>> {
    try {
      this.logger.log(
        `Starting "${this.config.type}" step for job ${context.jobId} -> ${this.config.target}`,
      );

      if (!currentData.uri) {
        throw new Error('Missing required field "input.uri"');
      }

      const schemaVersion = process.env.CLIENT_MQTT_SCHEMA_VERSION;

      const payload = {
        schemaVersion: schemaVersion,
        job_id: context.jobId,
        input: {
          uri: currentData.uri,
        },
      };

      const response: MqttEventPayload = await this.client.dispatch(
        this.config.target,
        payload,
      );

      if (response.schemaVersion !== schemaVersion) {
        throw new Error(
          'Received schemaVersion does not match local schemaVersion',
        );
      }

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
