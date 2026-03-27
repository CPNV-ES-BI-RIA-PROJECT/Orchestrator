import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { ETLWorkflow } from './strategies/etl-workflow.service';
import { WorkflowContext } from './models/workflow-context.model';
import { WorkflowResult } from './interfaces/workflow.interface';

export interface Payload {
  url: string;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);
  private readonly stackLinesToLog = 4;

  constructor(
    private readonly etlWorkflow: ETLWorkflow<Payload, WorkflowResult>,
  ) {}

  async startWorkflow(url: string): Promise<void> {
    this.logger.log(`Starting workflow process for url: ${url}`);
    const context = new WorkflowContext<Payload>('1', { url });

    const result = await this.etlWorkflow.execute(context);

    if (!result.isSuccess) {
      this.logger.error(
        `Workflow execution failed for url: ${url}. ${this.summarizeError(result.error)}`,
        this.getShortStack(result.error),
      );
      throw new Error(`Workflow failed`);
    }

    this.logger.log(`Workflow executed successfully for url: ${url}`);
  }

  private summarizeError(error: unknown): string {
    if (error instanceof AxiosError) {
      const target = error.config?.url ?? 'unknown';
      const status = error.response?.status ?? 'unknown';
      const code = error.code ?? 'unknown';

      return `HTTP error target=${target}, status=${status}, code=${code}, message=${error.message}`;
    }

    if (error instanceof Error) {
      return `message=${error.message}`;
    }

    return `message=${String(error)}`;
  }

  private getShortStack(error: unknown): string | undefined {
    if (!(error instanceof Error) || !error.stack) {
      return undefined;
    }

    return error.stack.split('\n').slice(0, this.stackLinesToLog).join('\n');
  }
}
