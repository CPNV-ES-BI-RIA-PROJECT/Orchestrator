import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
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

    it('should rethrow HttpException errors from the service', async () => {
      const dto: TriggerWorkflowDto = {
        url: 'https://example.com/test.pdf',
      };
      const error = new ConflictException(
        'Request has already been processed.',
      );

      mockWorkflowService.startWorkflow.mockRejectedValue(error);

      await expect(controller.triggerWorkflow(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should convert non-HTTP errors to InternalServerErrorException', async () => {
      const dto: TriggerWorkflowDto = {
        url: 'https://example.com/test.pdf',
      };
      const error = new Error('Database connection failed');

      mockWorkflowService.startWorkflow.mockRejectedValue(error);

      await expect(controller.triggerWorkflow(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
