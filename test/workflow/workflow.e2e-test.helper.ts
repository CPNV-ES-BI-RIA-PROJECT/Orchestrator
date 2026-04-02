import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowModule } from '../../src/workflow/workflow.module';
import { WorkflowService } from '../../src/workflow/workflow.service';
import { MQTT_CONNECT } from '../../src/client/client.constants';

export interface WorkflowServiceMock {
  startWorkflow: jest.Mock;
}

const mockMqttClient = {
  end: jest.fn(),
  on: jest.fn(),
  publish: jest.fn(),
  subscribe: jest.fn(),
};

const mockMqttConnect = jest.fn(() => mockMqttClient);

export function resetWorkflowE2eEnvironment(): void {
  delete process.env.CLIENT_PROTOCOL;
  delete process.env.CLIENT_MQTT_BROKER_URL;
  delete process.env.CLIENT_MQTT_NAMESPACE;
}

export function resetWorkflowE2eMocks(): void {
  mockMqttConnect.mockClear();
  mockMqttClient.end.mockClear();
  mockMqttClient.on.mockClear();
  mockMqttClient.publish.mockClear();
  mockMqttClient.subscribe.mockClear();
}

export async function createWorkflowE2eApp(
  workflowServiceMock: WorkflowServiceMock,
  protocol: 'http' | 'mqtt' = 'http',
): Promise<INestApplication> {
  resetWorkflowE2eEnvironment();
  resetWorkflowE2eMocks();

  process.env.CLIENT_PROTOCOL = protocol;
  process.env.CLIENT_MQTT_BROKER_URL = 'mqtt://localhost:1883';
  process.env.CLIENT_MQTT_NAMESPACE = 'stack1';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [WorkflowModule],
  })
    .overrideProvider(WorkflowService)
    .useValue(workflowServiceMock)
    .overrideProvider(MQTT_CONNECT)
    .useValue(mockMqttConnect)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');

  await app.init();

  return app;
}
