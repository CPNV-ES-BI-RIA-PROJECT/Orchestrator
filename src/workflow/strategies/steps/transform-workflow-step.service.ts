import {
  IWorkflowStep,
  StepResult,
} from '../../interfaces/workflow-step.interface';
import { WorkflowContext } from '../../models/workflow-context.model';
import * as clientInterface from '../../../client/interfaces/client.interface';
import { StepConfig } from '../../interfaces/workflow-config.interface';

import axios from 'axios';
import FormData from 'form-data';

export class TransformWorkflowStepService implements IWorkflowStep {
  constructor(
    private readonly config: StepConfig,
    private readonly client: clientInterface.IClient,
  ) {}

  async execute(
    context: WorkflowContext<unknown>,
    currentData: any,
  ): Promise<StepResult<unknown>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const s3Url =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        typeof currentData === 'string' ? currentData : currentData.url;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const fileResponse = await axios.get(s3Url, { responseType: 'stream' });

      const formData = new FormData();

      formData.append('file', fileResponse.data, 'downloaded-file.ics');

      const response = await this.client.postWithHeaders(
        this.config.targetUrl,
        formData,
        formData.getHeaders(),
      );

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
