import { MqttWorkflowStepService } from '../../../../src/workflow/strategies/steps/mqtt-workflow-step.service';
import { WorkflowContext } from '../../../../src/workflow/models/workflow-context.model';
import { IClient } from '../../../../src/client/interfaces/client.interface';
import { StepConfig } from '../../../../src/workflow/interfaces/workflow-config.interface';

describe('MqttWorkflowStepService', () => {
  let clientMock: jest.Mocked<IClient>;

  beforeEach(() => {
    clientMock = { dispatch: jest.fn() };
  });

  const mockContext = new WorkflowContext('job-uuid-456', {
    uri: 'https://example.com/shared_file.csv',
  });

  it.each([
    ['extract', { uri: 'https://example.com/extracted.csv' }],
    ['transform', { uri: 'https://example.com/transformed.csv' }],
    ['load', { uri: 'https://example.com/loaded.csv' }],
  ])(
    'should execute a %s step with a contract-compliant MQTT start payload',
    async (type, output) => {
      const currentData = { uri: 'https://example.com/shared_file.csv' };
      const completedPayload = {
        schemaVersion: '1.0',
        job_id: 'job-uuid-456',
        output,
      };
      const config: StepConfig = { type, target: type };
      const service = new (MqttWorkflowStepService as any)(config, clientMock, {
        get: jest.fn().mockReturnValue('1.0'),
      });

      clientMock.dispatch.mockResolvedValue(completedPayload);

      const result = await service.execute(mockContext, currentData);

      expect(clientMock.dispatch).toHaveBeenCalledWith(type, {
        schemaVersion: '1.0',
        job_id: 'job-uuid-456',
        input: currentData,
      });
      expect(result).toEqual({ isSuccess: true, data: output });
    },
  );

  it('should keep the same job_id across the step request and response handling', async () => {
    const config: StepConfig = { type: 'extract', target: 'extract' };
    const service = new (MqttWorkflowStepService as any)(config, clientMock, {
      get: jest.fn().mockReturnValue('1.0'),
    });

    clientMock.dispatch.mockResolvedValue({
      schemaVersion: '1.0',
      job_id: 'job-uuid-456',
      output: { uri: 'https://example.com/shared_data.csv' },
    });

    await service.execute(mockContext, {
      uri: 'https://example.com/shared_file.csv',
    });

    expect(clientMock.dispatch).toHaveBeenCalledWith('extract', {
      schemaVersion: '1.0',
      job_id: 'job-uuid-456',
      input: { uri: 'https://example.com/shared_file.csv' },
    });
  });

  it('should return a failed StepResult if the client throws an error', async () => {
    const config: StepConfig = { type: 'extract', target: 'extract' };
    const service = new (MqttWorkflowStepService as any)(config, clientMock, {
      get: jest.fn().mockReturnValue('1.0'),
    });
    const error = new Error('MQTT Error');

    clientMock.dispatch.mockRejectedValue(error);

    const result = await service.execute(mockContext, {
      uri: 'https://example.com/shared_file.csv',
    });

    expect(result).toEqual({ isSuccess: false, error: error });
  });

  it('should return a failed StepResult when the current data does not include input.uri', async () => {
    const config: StepConfig = { type: 'extract', target: 'extract' };
    const service = new (MqttWorkflowStepService as any)(config, clientMock, {
      get: jest.fn().mockReturnValue('1.0'),
    });

    const result = await service.execute(mockContext, {});

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toContain(
      'Missing required field "input.uri"',
    );
    expect(clientMock.dispatch).not.toHaveBeenCalled();
  });
});
