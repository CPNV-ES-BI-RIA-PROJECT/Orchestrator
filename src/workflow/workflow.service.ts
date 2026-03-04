import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowService {
  async startWorkflow(payload): Promise<void> {
    console.log(payload);
    await Promise.resolve();
  }
}
