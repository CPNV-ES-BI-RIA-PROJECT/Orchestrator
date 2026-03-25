import { Test, TestingModule } from '@nestjs/testing';
import { ClientModule } from '../../src/client/client.module';
import { CLIENT_TOKEN } from '../../src/client/client.constants';

describe('ClientModule Wiring', () => {
  const setupModuleWithProtocol = async (protocol: string) => {
    process.env.CLIENT_PROTOCOL = protocol;

    return Test.createTestingModule({
      imports: [ClientModule],
    }).compile();
  };

  afterEach(() => {
    delete process.env.CLIENT_PROTOCOL;
    delete process.env.CLIENT_TIMEOUT;
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
