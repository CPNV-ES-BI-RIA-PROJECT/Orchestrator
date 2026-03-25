import { HttpWorkflowStepService } from '../../../../src/workflow/strategies/steps/http-workflow-step.service';
import { WorkflowContext } from '../../../../src/workflow/models/workflow-context.model';
import { IClient } from '../../../../src/client/interfaces/client.interface';
import { StepConfig } from '../../../../src/workflow/interfaces/workflow-config.interface';

describe('HttpWorkflowStepService', () => {
  let clientMock: jest.Mocked<IClient>;

  beforeEach(() => {
    clientMock = { dispatch: jest.fn() };
  });

  const mockContext = new WorkflowContext('test-corr-id', { original: 'file' });

  it.each([
    [
      'extract',
      'https://api.com/extract',
      { file: 'data' },
      { extracted: true },
    ],
    [
      'transform',
      'https://api.com/transform',
      { extracted: true },
      { transformed: true },
    ],
    ['load', 'https://api.com/load', { transformed: true }, { loaded: true }],
  ])(
    'should execute a %s step using the flowing pipeline data',
    async (type, url, transientData, expectedResponse) => {
      const config: StepConfig = { type: type as any, target: url };
      const service = new HttpWorkflowStepService(config, clientMock);

      clientMock.dispatch.mockResolvedValue(expectedResponse);

      const result = await service.execute(mockContext, transientData);

      expect(clientMock.dispatch).toHaveBeenCalledWith(url, transientData);
      expect(result).toEqual({ isSuccess: true, data: expectedResponse });
    },
  );

  it('should return a failed StepResult if the client throws an error', async () => {
    const config: StepConfig = { type: 'extract', target: 'http://err' };
    const service = new HttpWorkflowStepService(config, clientMock);
    const error = new Error('Network Error');

    clientMock.dispatch.mockRejectedValue(error);

    const result = await service.execute(mockContext, {});

    expect(result).toEqual({ isSuccess: false, error: error });
  });
});
