import { Test, TestingModule } from '@nestjs/testing';
import { ExtractWorkflowStepService } from '../../../../src/workflow/strategies/steps/extract-workflow-step.service';
import { CLIENT_TOKEN } from '../../../../src/client/client.constants';
import { WorkflowContext } from '../../../../src/workflow/models/workflow-context.model';
import { IClient } from '../../../../src/client/interfaces/client.interface';

describe('ExtractWorkflowStepService', () => {
  let service: ExtractWorkflowStepService;
  let clientMock: jest.Mocked<IClient>;

  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };

    clientMock = {
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractWorkflowStepService,
        {
          provide: CLIENT_TOKEN,
          useValue: clientMock,
        },
      ],
    }).compile();

    service = module.get<ExtractWorkflowStepService>(
      ExtractWorkflowStepService,
    );
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createMockContext = (payload: unknown = {}): WorkflowContext<unknown> =>
    ({
      payload,
    }) as WorkflowContext<unknown>;

  describe('execute', () => {
    it('should call client.post with the URL from process.env', async () => {
      const mockUrl = 'https://api.production.com/extract';
      process.env.EXTRACT_WORKFLOW_URL = mockUrl;
      const context = createMockContext({ id: 123 });

      clientMock.post.mockResolvedValue({ status: 200 });

      await service.execute(context);

      expect(clientMock.post).toHaveBeenCalledWith(mockUrl, context.payload);
    });

    it('should propagate errors from the client', async () => {
      clientMock.post.mockRejectedValue(new Error('Network Error'));
      const context = createMockContext();

      await expect(service.execute(context)).rejects.toThrow('Network Error');
    });
  });
});
