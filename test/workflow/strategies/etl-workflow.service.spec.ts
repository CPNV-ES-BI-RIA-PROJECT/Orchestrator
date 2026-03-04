import { Test, TestingModule } from '@nestjs/testing';
import { ETLWorkflow } from '../../../src/workflow/strategies/etl-workflow.service';
import { WorkflowContext } from '../../../src/workflow/models/workflow-context.model';
import { IWorkflowStep } from '../../../src/workflow/interfaces/workflow-step.interface';
import { STEPS_TOKEN } from '../../../src/workflow/workflow.constants';

describe('ETLWorkflow', () => {
  let workflow: ETLWorkflow<any, any>;
  let mockSteps: jest.Mocked<IWorkflowStep>[];

  beforeEach(async () => {
    mockSteps = [
      { execute: jest.fn().mockResolvedValue({ isSuccess: true }) },
      { execute: jest.fn().mockResolvedValue({ isSuccess: true }) },
      { execute: jest.fn().mockResolvedValue({ isSuccess: true }) },
    ];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ETLWorkflow,
        {
          provide: STEPS_TOKEN,
          useValue: mockSteps,
        },
      ],
    }).compile();

    workflow = module.get<ETLWorkflow<any, any>>(ETLWorkflow);
  });

  it('should execute all steps successfully and return success', async () => {
    const context = new WorkflowContext('123', { file: 'test.pdf' } as any);

    mockSteps.forEach((step) => {
      step.execute.mockResolvedValue({ isSuccess: true });
    });

    const result = await workflow.execute(context);

    expect(result.isSuccess).toBe(true);
    expect(result.error).toBeUndefined();

    mockSteps.forEach((step) => {
      expect(step.execute).toHaveBeenCalledTimes(1);
      expect(step.execute).toHaveBeenCalledWith(context);
    });
  });

  it('should stop execution if Step 2 fails', async () => {
    const context = new WorkflowContext('123', { file: 'test.pdf' } as any);
    const failureError = new Error('Step 2 failed');

    mockSteps[0].execute.mockResolvedValue({ isSuccess: true });
    mockSteps[1].execute.mockResolvedValue({
      isSuccess: false,
      error: failureError,
    });

    const result = await workflow.execute(context);

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe(failureError);

    expect(mockSteps[0].execute).toHaveBeenCalled();
    expect(mockSteps[1].execute).toHaveBeenCalled();

    expect(mockSteps[2].execute).not.toHaveBeenCalled();
  });
});
