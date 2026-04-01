import { Test, TestingModule } from '@nestjs/testing';
import { CacheCheckResult, CacheService } from '../../src/cache/cache.service';
import { WorkflowService } from '../../src/workflow/workflow.service';
import { ETLWorkflow } from '../../src/workflow/strategies/etl-workflow.service';
import { WorkflowResult } from '../../src/workflow/interfaces/workflow.interface';
import { WorkflowContext } from '../../src/workflow/models/workflow-context.model';
import { CacheBusinessRequest } from '../../src/cache/cache-key.service';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let etlWorkflow: { execute: jest.Mock };
  let cacheService: { check: jest.Mock; publish: jest.Mock };

  const url = 'https://example.com/test.pdf';
  const cacheRequest = {
    payload: url,
  } as CacheBusinessRequest;

  beforeEach(async () => {
    etlWorkflow = {
      execute: jest.fn(),
    };

    cacheService = {
      check: jest.fn(),
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        {
          provide: ETLWorkflow,
          useValue: etlWorkflow,
        },
        {
          provide: CacheService,
          useValue: cacheService,
        },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should check the cache before executing the workflow on a MISS', async () => {
    const cacheCheckResult: CacheCheckResult = {
      status: 'MISS',
      alreadyProcessed: false,
      key: 'cache-key',
    };
    const workflowResult: WorkflowResult = {
      isSuccess: true,
    };

    cacheService.check.mockResolvedValue(cacheCheckResult);
    etlWorkflow.execute.mockResolvedValue(workflowResult);
    cacheService.publish.mockResolvedValue(undefined);

    await service.startWorkflow(url);

    expect(cacheService.check).toHaveBeenCalledWith(cacheRequest);
    expect(etlWorkflow.execute).toHaveBeenCalledTimes(1);
    expect(etlWorkflow.execute).toHaveBeenCalledWith(
      expect.any(WorkflowContext),
    );
    expect(cacheService.publish).toHaveBeenCalledWith(cacheRequest);
  });

  it('should throw when the cache check is READY', async () => {
    cacheService.check.mockResolvedValue({
      status: 'READY',
      alreadyProcessed: true,
      key: 'cache-key',
    } satisfies CacheCheckResult);

    await expect(service.startWorkflow(url)).rejects.toThrow(
      'Request has already been processed.',
    );

    expect(cacheService.check).toHaveBeenCalledWith(cacheRequest);
    expect(etlWorkflow.execute).not.toHaveBeenCalled();
    expect(cacheService.publish).not.toHaveBeenCalled();
  });

  it('should throw when the cache check is COMPUTING', async () => {
    cacheService.check.mockResolvedValue({
      status: 'COMPUTING',
      alreadyProcessed: true,
      key: 'cache-key',
    } satisfies CacheCheckResult);

    await expect(service.startWorkflow(url)).rejects.toThrow(
      'Request has already been processed.',
    );

    expect(cacheService.check).toHaveBeenCalledWith(cacheRequest);
    expect(etlWorkflow.execute).not.toHaveBeenCalled();
    expect(cacheService.publish).not.toHaveBeenCalled();
  });

  it('should not publish the cache when the workflow execution fails after a MISS', async () => {
    cacheService.check.mockResolvedValue({
      status: 'MISS',
      alreadyProcessed: false,
      key: 'cache-key',
    } satisfies CacheCheckResult);
    etlWorkflow.execute.mockResolvedValue({
      isSuccess: false,
      error: new Error('Workflow failed'),
    } satisfies WorkflowResult);

    await expect(service.startWorkflow(url)).rejects.toThrow('Workflow failed');
    expect(cacheService.check).toHaveBeenCalledWith(cacheRequest);
    expect(etlWorkflow.execute).toHaveBeenCalledTimes(1);
    expect(cacheService.publish).not.toHaveBeenCalled();
  });
});
