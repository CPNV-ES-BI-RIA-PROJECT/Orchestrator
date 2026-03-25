import { MqttWorkflowStepService } from '../../../../src/workflow/strategies/steps/mqtt-workflow-step.service';
import { WorkflowContext } from '../../../../src/workflow/models/workflow-context.model';
import { IClient } from '../../../../src/client/interfaces/client.interface';
import { StepConfig } from '../../../../src/workflow/interfaces/workflow-config.interface';

describe('MqttWorkflowStepService', () => {
  let clientMock: jest.Mocked<IClient>;
  const schemaVersion = '1.0';

  beforeEach(() => {
    process.env.CLIENT_MQTT_SCHEMA_VERSION = schemaVersion;
    clientMock = { dispatch: jest.fn() };
  });

  afterEach(() => {
    delete process.env.CLIENT_MQTT_SCHEMA_VERSION;
  });

  const mockContext = new WorkflowContext('job-uuid-456', {
    uri: 'https://example.com/shared_file.csv',
  });

  it.each([
    ['extract', 'extract', { uri: 'https://example.com/extracted.csv' }],
    ['transform', 'transform', { uri: 'https://example.com/transformed.csv' }],
    ['load', 'load', { uri: 'https://example.com/loaded.csv' }],
  ])(
    'should execute a %s step with a contract-compliant MQTT start payload',
    async (type, target, output) => {
      const currentData = { uri: 'https://example.com/shared_file.csv' };
      const completedPayload = {
        schemaVersion,
        job_id: 'job-uuid-456',
        output,
      };
      const config: StepConfig = { type, target };
      const service = new (MqttWorkflowStepService as any)(config, clientMock);

      clientMock.dispatch.mockResolvedValue(completedPayload);

      const result = await service.execute(mockContext, currentData);

      expect(clientMock.dispatch).toHaveBeenCalledWith(target, {
        schemaVersion,
        job_id: 'job-uuid-456',
        input: currentData,
      });
      expect(result).toEqual({ isSuccess: true, data: output });
    },
  );

  it('should keep the same job_id across the step request and response handling', async () => {
    const config: StepConfig = { type: 'extract', target: 'extract' };
    const service = new (MqttWorkflowStepService as any)(config, clientMock);

    clientMock.dispatch.mockResolvedValue({
      schemaVersion,
      job_id: 'job-uuid-456',
      output: { uri: 'https://example.com/shared_data.csv' },
    });

    await service.execute(mockContext, {
      uri: 'https://example.com/shared_file.csv',
    });

    expect(clientMock.dispatch).toHaveBeenCalledWith('extract', {
      schemaVersion,
      job_id: 'job-uuid-456',
      input: { uri: 'https://example.com/shared_file.csv' },
    });
  });

  it('should return a failed StepResult if the client throws an error', async () => {
    const config: StepConfig = { type: 'extract', target: 'bad-target' };
    const service = new (MqttWorkflowStepService as any)(config, clientMock);
    const error = new Error('MQTT Error');

    clientMock.dispatch.mockRejectedValue(error);

    const result = await service.execute(mockContext, {
      uri: 'https://example.com/shared_file.csv',
    });

    expect(result).toEqual({ isSuccess: false, error: error });
  });

  it('should return a failed StepResult when the current data does not include input.uri', async () => {
    const config: StepConfig = { type: 'extract', target: 'extract' };
    const service = new (MqttWorkflowStepService as any)(config, clientMock);

    const result = await service.execute(mockContext, {});

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toContain(
      'Missing required field "input.uri"',
    );
    expect(clientMock.dispatch).not.toHaveBeenCalled();
  });

  it('should return a failed StepResult when the response schemaVersion does not match the accepted version', async () => {
    const config: StepConfig = { type: 'extract', target: 'extract' };
    const service = new (MqttWorkflowStepService as any)(config, clientMock);

    clientMock.dispatch.mockResolvedValue({
      schemaVersion: '2.0',
      job_id: 'job-uuid-456',
      output: { uri: 'https://example.com/shared_data.csv' },
    });

    const result = await service.execute(mockContext, {
      uri: 'https://example.com/shared_file.csv',
    });

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toContain('schemaVersion');
  });
});
