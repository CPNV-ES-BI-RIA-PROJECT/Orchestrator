import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from '../../src/workflow/workflow.controller';
import { WorkflowService } from '../../src/workflow/workflow.service';
import { TriggerWorkflowDto } from '../../src/workflow/dto/trigger-workflow.dto';

describe('WorkflowController', () => {
  let controller: WorkflowController;

  const mockWorkflowService = {
    startWorkflow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowController],
      providers: [
        {
          provide: WorkflowService,
          useValue: mockWorkflowService,
        },
      ],
    }).compile();

    controller = module.get<WorkflowController>(WorkflowController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trigger', () => {
    it('should call startWorkflow with the combined file and body payload', async () => {
      const dto: TriggerWorkflowDto = {
        url: 'https://example.com/test.pdf',
      };

      await controller.triggerWorkflow(dto);

      expect(mockWorkflowService.startWorkflow).toHaveBeenCalledWith(dto.url);
      expect(mockWorkflowService.startWorkflow).toHaveBeenCalledTimes(1);
    });

    it('should bubble up an error if the service fails', async () => {
      const dto: TriggerWorkflowDto = {
        url: 'https://example.com/test.pdf',
      };
      const error = new Error('Database connection failed');

      mockWorkflowService.startWorkflow.mockRejectedValue(error);

      await expect(controller.triggerWorkflow(dto)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
