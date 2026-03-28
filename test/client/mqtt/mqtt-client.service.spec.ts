import { Test, TestingModule } from '@nestjs/testing';
import { MqttClientService } from '../../../src/client/mqtt/mqtt-client.service';
import clientConfig from '../../../src/client/config/client.config';
import { MqttBrokerConnectionService } from '../../../src/client/mqtt/mqtt-broker-connection.service';
import {
  MQTT_COMMAND_PUBLISHER,
  MQTT_CONNECT,
} from '../../../src/client/client.constants';

const mockMqttClient = {
  publish: jest.fn(),
  end: jest.fn(),
};

const mockConnect = jest.fn(() => mockMqttClient);

describe('MqttClientService', () => {
  let service: MqttClientService;
  let mqttBrokerConnectionService: {
    waitForCompletion: jest.Mock;
  };
  let mqttCommandPublisher: jest.Mock;

  const mockClientConfig = {
    protocol: 'mqtt',
    http: {
      timeout: 5000,
      baseUrl: '',
    },
    mqtt: {
      brokerUrl: 'mqtt://localhost:1883',
      namespace: 'stack1',
      timeout: 5000,
    },
  };

  beforeEach(async () => {
    mqttBrokerConnectionService = {
      waitForCompletion: jest.fn(),
    };
    mqttCommandPublisher = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: MqttClientService,
          useFactory: () =>
            new MqttClientService(
              mockClientConfig as any,
              mqttCommandPublisher as any,
              mockConnect as any,
              mqttBrokerConnectionService as unknown as MqttBrokerConnectionService,
            ),
        },
        {
          provide: MQTT_COMMAND_PUBLISHER,
          useValue: mqttCommandPublisher,
        },
        {
          provide: MQTT_CONNECT,
          useValue: mockConnect,
        },
        {
          provide: clientConfig.KEY,
          useValue: mockClientConfig,
        },
      ],
    }).compile();

    service = module.get<MqttClientService>(MqttClientService);

    jest.clearAllMocks();
  });

  describe('dispatch', () => {
    const targetService = 'extract';
    const payload = {
      schemaVersion: '1.0',
      job_id: 'job-123',
      input: { uri: 'https://example.com/shared_file.csv' },
    };

    it('should publish the MQTT start command and resolve on completion', async () => {
      const completedPayload = {
        schemaVersion: '1.0',
        job_id: 'job-123',
        output: { uri: 'https://example.com/shared_data.csv' },
      };

      mqttCommandPublisher.mockResolvedValue(undefined);
      mqttBrokerConnectionService.waitForCompletion.mockResolvedValue(
        completedPayload,
      );

      const result = await service.dispatch(targetService, payload);

      expect(mqttCommandPublisher).toHaveBeenCalledWith(
        mockMqttClient,
        'etl/stack1/extract/cmd/start',
        payload,
      );
      expect(
        mqttBrokerConnectionService.waitForCompletion,
      ).toHaveBeenCalledWith(
        targetService,
        payload.job_id,
        mockClientConfig.mqtt.timeout,
      );
      expect(result).toEqual(completedPayload);
    });

    it('should use the configured namespace when publishing the start command', async () => {
      mqttCommandPublisher.mockResolvedValue(undefined);
      mqttBrokerConnectionService.waitForCompletion.mockResolvedValue({
        job_id: payload.job_id,
        output: { uri: 'out' },
      });
      mockClientConfig.mqtt.namespace = 'stack2';

      await service.dispatch(targetService, payload);

      expect(mqttCommandPublisher).toHaveBeenCalledWith(
        mockMqttClient,
        'etl/stack2/extract/cmd/start',
        payload,
      );
    });

    it('should reject on failed completion from broker connection service', async () => {
      mqttCommandPublisher.mockResolvedValue(undefined);
      mqttBrokerConnectionService.waitForCompletion.mockRejectedValue(
        new Error('File not found'),
      );

      await expect(service.dispatch(targetService, payload)).rejects.toThrow(
        'File not found',
      );
    });

    it('should reject on timeout when no completion event arrives', async () => {
      mqttCommandPublisher.mockResolvedValue(undefined);
      mqttBrokerConnectionService.waitForCompletion.mockRejectedValue(
        new Error('MQTT response timed out'),
      );

      await expect(service.dispatch(targetService, payload)).rejects.toThrow(
        'MQTT response timed out',
      );
    });

    it('should reject when job_id is undefined', async () => {
      await expect(
        service.dispatch(targetService, {
          schemaVersion: '1.0',
          input: { uri: 'https://example.com/shared_file.csv' },
        }),
      ).rejects.toThrow('jobId is undefined');
    });
  });
});
