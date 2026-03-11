import { ExtractWorkflowStepService } from '../../../../src/workflow/strategies/steps/extract-workflow-step.service';
import { WorkflowContext } from '../../../../src/workflow/models/workflow-context.model';
import { IClient } from '../../../../src/client/interfaces/client.interface';
import { StepConfig } from '../../../../src/workflow/interfaces/workflow-config.interface';

describe('ExtractWorkflowStepService', () => {
  let service: ExtractWorkflowStepService;
  let clientMock: jest.Mocked<IClient>;
  let mockConfig: StepConfig;

  beforeEach(() => {
    clientMock = {
      post: jest.fn(),
    };

    mockConfig = {
      type: 'extract',
      targetUrl: 'https://api.production.com/extract',
    };

    service = new ExtractWorkflowStepService(mockConfig, clientMock);
  });

  const createMockContext = (payload: unknown = {}): WorkflowContext<unknown> =>
    ({
      payload,
    }) as WorkflowContext<unknown>;

  describe('execute', () => {
    it('should call client.post with the URL from the configuration', async () => {
      const context = createMockContext({ id: 123 });
      clientMock.post.mockResolvedValue({ status: 200 });

      await service.execute(context);

      expect(clientMock.post).toHaveBeenCalledWith(
        mockConfig.targetUrl,
        context.payload,
      );
    });

    it('should propagate errors from the client', async () => {
      clientMock.post.mockRejectedValue(new Error('Network Error'));
      const context = createMockContext();

      await expect(service.execute(context)).rejects.toThrow('Network Error');
    });
  });
});
