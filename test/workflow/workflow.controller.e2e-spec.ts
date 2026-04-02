import { ConflictException, INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createWorkflowE2eApp,
  resetWorkflowE2eEnvironment,
  resetWorkflowE2eMocks,
  WorkflowServiceMock,
} from './workflow.e2e-test.helper';

describe('WorkflowController (E2E)', () => {
  describe.each(['http', 'mqtt'] as const)('with %s protocol', (protocol) => {
    let app: INestApplication;

    const mockWorkflowService: WorkflowServiceMock = {
      startWorkflow: jest.fn(),
    };

    beforeAll(async () => {
      app = await createWorkflowE2eApp(mockWorkflowService, protocol);
    });

    afterEach(() => {
      mockWorkflowService.startWorkflow.mockReset();
      resetWorkflowE2eMocks();
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }

      resetWorkflowE2eEnvironment();
      resetWorkflowE2eMocks();
    });

    it('POST /api/v1/workflows/trigger -> 202 Accepted', async () => {
      mockWorkflowService.startWorkflow.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/api/v1/workflows/trigger')
        .send({ url: 'https://example.com/test.pdf' })
        .expect(202);

      expect(mockWorkflowService.startWorkflow).toHaveBeenCalledWith(
        'https://example.com/test.pdf',
      );
    });

    it('POST /api/v1/workflows/trigger -> 400 Bad Request on empty payload', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/workflows/trigger')
        .send({})
        .expect(400);

      expect(mockWorkflowService.startWorkflow).not.toHaveBeenCalled();
    });

    it('POST /api/v1/workflows/trigger -> 400 Bad Request on invalid URL', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/workflows/trigger')
        .send({ url: 'trust i am a valid URL' })
        .expect(400);

      expect(mockWorkflowService.startWorkflow).not.toHaveBeenCalled();
    });

    it('POST /api/v1/workflows/trigger -> 409 Conflict when the payload was already processed', async () => {
      mockWorkflowService.startWorkflow.mockRejectedValue(
        new ConflictException('Request has already been processed.'),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/workflows/trigger')
        .send({ url: 'https://example.com/test.pdf' })
        .expect(409);

      expect(response.body.statusCode).toBe(409);
      expect(response.body.message).toBe('Request has already been processed.');
    });

    it('POST /api/v1/workflows/trigger -> 500 Internal Server Error on unexpected failure', async () => {
      mockWorkflowService.startWorkflow.mockRejectedValue(
        new Error('Unexpected failure'),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/workflows/trigger')
        .send({ url: 'https://example.com/test.pdf' })
        .expect(500);

      expect(response.body.statusCode).toBe(500);
      expect(response.body.message).toBe('Workflow failed unexpectedly');
    });
  });
});
