import { Test, TestingModule } from '@nestjs/testing';
import { ClientModule } from '../../src/client/client.module';
import { CLIENT_TOKEN, MQTT_CONNECT } from '../../src/client/client.constants';

const mockMqttClient = {
  end: jest.fn(),
};

const mockConnect = jest.fn(() => mockMqttClient);

describe('ClientModule Wiring', () => {
  const createdModules: TestingModule[] = [];

  const setupModuleWithProtocol = async (protocol: string) => {
    process.env.CLIENT_PROTOCOL = protocol;

    const module = await Test.createTestingModule({
      imports: [ClientModule],
    })
      .overrideProvider(MQTT_CONNECT)
      .useValue(mockConnect)
      .compile();

    createdModules.push(module);
    return module;
  };

  afterEach(async () => {
    await Promise.all(createdModules.map((module) => module.close()));
    createdModules.length = 0;
    delete process.env.CLIENT_PROTOCOL;
    delete process.env.CLIENT_TIMEOUT;
    jest.clearAllMocks();
  });

  it('should provide a client when CLIENT_PROTOCOL=http', async () => {
    const module: TestingModule = await setupModuleWithProtocol('http');
    const client = module.get(CLIENT_TOKEN);

    expect(client).toBeDefined();
  });

  it('should provide a client when CLIENT_PROTOCOL=mqtt', async () => {
    const module: TestingModule = await setupModuleWithProtocol('mqtt');
    const client = module.get(CLIENT_TOKEN);

    expect(client).toBeDefined();
  });

  it('should throw an explicit config error for invalid protocol', async () => {
    await expect(setupModuleWithProtocol('grpc')).rejects.toThrow(
      'No client protocol was configured or it was spelled incorrectly. Received protocol: "grpc"',
    );
  });
});
