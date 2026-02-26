import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { WorkflowModule } from '../../src/workflow/workflow.module';
import { WorkflowService } from '../../src/workflow/workflow.service';
import {AllExceptionsFilter} from "../../src/workflow/workflow.filter";

describe('WorkflowController (E2E)', () => {
    let app: INestApplication;
    let service: WorkflowService;

    const mockWorkflowService = {
        startWorkflow: jest.fn(),
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [WorkflowModule],
        })
            .overrideProvider(WorkflowService)
            .useValue(mockWorkflowService)
            .compile();

        app = moduleFixture.createNestApplication();

        app.setGlobalPrefix('api');

        await app.init();
        service = moduleFixture.get<WorkflowService>(WorkflowService);
    });

    it('POST /api/v1/workflows/trigger -> 202 Accepted', async () => {
        mockWorkflowService.startWorkflow.mockResolvedValue(undefined);

        return request(app.getHttpServer())
            .post('/api/v1/workflows/trigger')
            .send({ filename: 'test.pdf' })
            .expect(202);
    });

    it('POST /api/v1/workflows/trigger -> 400 Bad Request on empty payload', async () => {
        return request(app.getHttpServer())
            .post('/api/v1/workflows/trigger')
            .send({})
            .expect(400);
    });

    afterAll(async () => {
        await app.close();
    });
});