import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowService {
  startWorkflow(): string {
    return 'Hello World!';
  }
}
