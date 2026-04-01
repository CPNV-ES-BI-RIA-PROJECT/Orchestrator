import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { ETLWorkflow } from './strategies/etl-workflow.service';
import { WorkflowContext } from './models/workflow-context.model';
import { WorkflowResult } from './interfaces/workflow.interface';
import { CacheService } from '../cache/cache.service';

export interface Payload {
  url: string;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @Inject(CacheService) private readonly cacheService: CacheService,
    private readonly etlWorkflow: ETLWorkflow<Payload, WorkflowResult>,
  ) {}

  async startWorkflow(url: string): Promise<void> {
    await this.checkCache(url);

    const context = new WorkflowContext<Payload>('1', { url });
    this.logger.log(`Triggering workflow for job ${context.jobId}`);

    const result = await this.etlWorkflow.execute(context);

    if (!result.isSuccess) {
      this.logger.error(`Workflow failed for job ${context.jobId}`);
      throw new Error(`Workflow failed`);
    }

    await this.publishCache(url);

    this.logger.log(`Workflow finished for job ${context.jobId}`);
  }

  private async checkCache(url: string) {
    const cacheResult = await this.cacheService.check({
      payload: url,
    });

    if (cacheResult.alreadyProcessed) {
      this.logger.log(`This request has already been processed.`);
      throw new ConflictException('Request has already been processed.');
    }
  }

  private async publishCache(url: string) {
    await this.cacheService.publish({
      payload: url,
    });
  }
}
