import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { MqttClientService } from '../../../src/client/mqtt/mqtt-client.service';

describe('MqttClientService', () => {
  let service: MqttClientService;
  let mqttClientProxy: jest.Mocked<ClientProxy>;

  const mockClientProxy = {
    emit: jest.fn(),
    connect: jest.fn(),
    close: jest.fn(),
  } as unknown as jest.Mocked<ClientProxy>;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, unknown> = {
        'client.mqtt.namespace': 'stack1',
        'client.mqtt.timeout': 5000,
      };

      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: MqttClientService,
          useFactory: () =>
            new (MqttClientService as any)(mockClientProxy, mockConfigService),
        },
        {
          provide: 'MQTT_CLIENT',
          useValue: mockClientProxy,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MqttClientService>(MqttClientService);
    mqttClientProxy = module.get('MQTT_CLIENT');

    jest.clearAllMocks();
  });

  describe('dispatch', () => {
    const targetService = 'extract';
    const payload = {
      schemaVersion: '1.0',
      job_id: 'job-123',
      input: { uri: 'https://example.com/shared_file.csv' },
    };

    it('should publish the MQTT start command to the contract topic and resolve on matching event/completed', async () => {
      const completedPayload = {
        schemaVersion: '1.0',
        job_id: 'job-123',
        output: { uri: 'https://example.com/shared_data.csv' },
      };

      jest
        .spyOn(service as any, 'waitForCompletion')
        .mockResolvedValue(completedPayload);
      mqttClientProxy.emit.mockReturnValue({
        subscribe: jest.fn(),
      } as any);

      const result = await service.dispatch(targetService, payload);

      expect(mqttClientProxy.emit).toHaveBeenCalledWith(
        'etl/stack1/extract/cmd/start',
        payload,
      );
      expect(result).toEqual(completedPayload);
    });

    it('should use the configured namespace when publishing the start command', async () => {
      jest
        .spyOn(service as any, 'waitForCompletion')
        .mockResolvedValue({ job_id: payload.job_id, output: { uri: 'out' } });
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          'client.mqtt.namespace': 'stack2',
          'client.mqtt.timeout': 5000,
        };

        return config[key];
      });

      await service.dispatch(targetService, payload);

      expect(mqttClientProxy.emit).toHaveBeenCalledWith(
        'etl/stack2/extract/cmd/start',
        payload,
      );
    });

    it('should reject on event/failed with the mapped domain error message', async () => {
      jest
        .spyOn(service as any, 'waitForCompletion')
        .mockRejectedValue(new Error('File not found'));

      await expect(service.dispatch(targetService, payload)).rejects.toThrow(
        'File not found',
      );
    });

    it('should reject on timeout when no completion event arrives', async () => {
      jest
        .spyOn(service as any, 'waitForCompletion')
        .mockRejectedValue(new Error('MQTT response timed out'));

      await expect(service.dispatch(targetService, payload)).rejects.toThrow(
        'MQTT response timed out',
      );
    });
  });
});
