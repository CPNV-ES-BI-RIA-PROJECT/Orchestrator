import {
  IWorkflowStep,
  StepResult,
} from '../../interfaces/workflow-step.interface';
import { WorkflowContext } from '../../models/workflow-context.model';
import * as clientInterface from '../../../client/interfaces/client.interface';
import { StepConfig } from '../../interfaces/workflow-config.interface';

interface ExtractPayload {
  fileReference: string;
}

export class ExtractWorkflowStepService implements IWorkflowStep {
  constructor(
    private readonly config: StepConfig,
    private readonly client: clientInterface.IClient,
  ) {}

  async execute(
    context: WorkflowContext<string>,
    currentData: unknown,
  ): Promise<StepResult<unknown>> {
    try {
      const payload = currentData as ExtractPayload;

      if (!payload || !payload.fileReference) {
        throw new Error('Missing fileReference in step payload');
      }

      const sourceUrl = payload.fileReference;

      const dateString = new Date().toISOString().split('T')[0];
      const fileName = sourceUrl.split('/').pop() || 'calendar.ics';
      const destinationRemote = `bi1-arthur/raw/job-${dateString}-001/${fileName}`;

      const targetUrl = this.config.targetUrl;

      const urlWithParams = `${targetUrl}?sourceUrl=${encodeURIComponent(
        sourceUrl,
      )}&destinationRemote=${encodeURIComponent(destinationRemote)}`;

      const response = await this.client.post(urlWithParams, {});

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
