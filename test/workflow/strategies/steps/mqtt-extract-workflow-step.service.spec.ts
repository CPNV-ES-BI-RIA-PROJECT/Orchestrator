import { MqttExtractWorkflowStepService } from '../../../../src/workflow/strategies/steps/mqtt-extract-workflow-step.service';
import { WorkflowContext } from '../../../../src/workflow/models/workflow-context.model';
import { IClient } from '../../../../src/client/interfaces/client.interface';
import { StepConfig } from '../../../../src/workflow/interfaces/workflow-config.interface';

describe('MqttExtractWorkflowStepService', () => {
  let clientMock: jest.Mocked<IClient>;
  const schemaVersion = '1.0';
  const serviceClass = MqttExtractWorkflowStepService;
  const config: StepConfig = { type: 'extract', target: 'extract' };

  beforeEach(() => {
    process.env.CLIENT_MQTT_SCHEMA_VERSION = schemaVersion;
    clientMock = { dispatch: jest.fn() };
  });

  afterEach(() => {
    delete process.env.CLIENT_MQTT_SCHEMA_VERSION;
  });

  const mockContext = new WorkflowContext('job-uuid-456', {
    url: 'https://example.com/shared_file.csv',
  });

  it('should execute an extract step with a contract-compliant MQTT start payload', async () => {
    const currentData = { url: 'https://example.com/shared_file.csv' };
    const responsePayload = {
      schemaVersion,
      job_id: 'job-uuid-456',
      output: { uri: 'https://example.com/extract.csv' },
    };

    const service = new serviceClass(config, clientMock);

    clientMock.dispatch.mockResolvedValue(responsePayload);

    const result = await service.execute(mockContext, currentData);

    expect(clientMock.dispatch).toHaveBeenCalledWith('extract', {
      schemaVersion,
      job_id: 'job-uuid-456',
      input: { uri: currentData.url },
    });
    expect(result).toEqual({ isSuccess: true, data: responsePayload });
  });

  it('should keep the same job_id across the step request and response handling', async () => {
    const service = new serviceClass(config, clientMock);

    clientMock.dispatch.mockResolvedValue({
      schemaVersion,
      job_id: 'job-uuid-456',
      output: { uri: 'https://example.com/shared_data.csv' },
    });

    await service.execute(mockContext, {
      url: 'https://example.com/shared_file.csv',
    });

    expect(clientMock.dispatch).toHaveBeenCalledWith('extract', {
      schemaVersion,
      job_id: 'job-uuid-456',
      input: { uri: 'https://example.com/shared_file.csv' },
    });
  });

  it('should return a failed StepResult if the client throws an error', async () => {
    const service = new serviceClass(config, clientMock);
    const error = new Error('MQTT Error');

    clientMock.dispatch.mockRejectedValue(error);

    const result = await service.execute(mockContext, {
      url: 'https://example.com/shared_file.csv',
    });

    expect(result).toEqual({ isSuccess: false, error });
  });

  it('should return a failed StepResult when the current data does not include input.url', async () => {
    const service = new serviceClass(config, clientMock);

    // @ts-expect-error
    const result = await service.execute(mockContext, {});

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toContain(
      'Missing required field "input.url"',
    );
    expect(clientMock.dispatch).not.toHaveBeenCalled();
  });

  it('should return a failed StepResult when the response schemaVersion does not match the accepted version', async () => {
    const service = new serviceClass(config, clientMock);

    clientMock.dispatch.mockResolvedValue({
      schemaVersion: '2.0',
      job_id: 'job-uuid-456',
      output: { url: 'https://example.com/shared_data.csv' },
    });

    const result = await service.execute(mockContext, {
      url: 'https://example.com/shared_file.csv',
    });

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toContain('schemaVersion');
  });
});
