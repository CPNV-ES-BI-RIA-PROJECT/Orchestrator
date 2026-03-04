import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from '../../src/workflow/workflow.controller';
import { WorkflowService } from '../../src/workflow/workflow.service';

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
      const mockFile = {
        originalname: 'test.pdf',
      } as Express.Multer.File;

      await controller.triggerWorkflow(mockFile);

      expect(mockWorkflowService.startWorkflow).toHaveBeenCalledWith(mockFile);
      expect(mockWorkflowService.startWorkflow).toHaveBeenCalledTimes(1);
    });

    it('should bubble up an error if the service fails', async () => {
      const mockFile = {
        originalname: 'test.pdf',
      } as Express.Multer.File;
      const error = new Error('Database connection failed');

      mockWorkflowService.startWorkflow.mockRejectedValue(error);

      await expect(controller.triggerWorkflow(mockFile)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
