import { Inject, Injectable } from '@nestjs/common';
import {
  IWorkflowStep,
  StepResult,
} from '../../interfaces/workflow-step.interface';
import { WorkflowContext } from '../../models/workflow-context.model';
import { CLIENT_TOKEN } from '../../../client/client.constants';
import * as clientInterface from '../../../client/interfaces/client.interface';

@Injectable()
export class ExtractWorkflowStepService implements IWorkflowStep {
  constructor(
    @Inject(CLIENT_TOKEN) private readonly client: clientInterface.IClient,
  ) {}

  async execute(context: WorkflowContext<unknown>): Promise<StepResult> {
    const url = process.env.EXTRACT_WORKFLOW_URL || '';

    return await this.client.post(url, context.payload);
  }
}
