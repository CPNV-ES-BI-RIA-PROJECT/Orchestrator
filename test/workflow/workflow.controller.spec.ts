import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from '../../src/workflow/workflow.controller';
import { WorkflowService } from '../../src/workflow/workflow.service';
import {BadRequestException} from "@nestjs/common";

describe('WorkflowController', () => {
    let controller: WorkflowController;
    let service: WorkflowService;

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
        service = module.get<WorkflowService>(WorkflowService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('trigger', () => {

        const mockFilePayload = {
            originalname: 'document.pdf',
            mimetype: 'application/pdf',
            buffer: Buffer.from('fake-file-content'),
            size: 1024,
        };

        it('should call startWorkflow with the correct payload and return void', async () => {
            mockWorkflowService.startWorkflow.mockResolvedValue(undefined);

            const result = await controller.triggerWorkflow(mockFilePayload);

            expect(service.startWorkflow).toHaveBeenCalledWith(mockFilePayload);
            expect(service.startWorkflow).toHaveBeenCalledTimes(1);
            expect(result).toBeUndefined();
        });

        it('should bubble up an error if the service fails', async () => {
            const error = new Error('Database connection failed');
            mockWorkflowService.startWorkflow.mockRejectedValue(error);

            await expect(controller.triggerWorkflow(mockFilePayload)).rejects.toThrow('Database connection failed');
        });

        it('should throw BadRequest if the payload is empty', async () => {
            const emptyPayload = {};

            await expect(controller.triggerWorkflow(emptyPayload)).rejects.toThrow(BadRequestException);
            expect(service.startWorkflow).toHaveBeenCalledTimes(0);
        });
    });
});