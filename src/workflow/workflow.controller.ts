import {Body, Controller, Post} from '@nestjs/common';
import { WorkflowService } from './workflow.service';

@Controller('/v1')
export class WorkflowController {
  constructor(private readonly appService: WorkflowService) {}

  @Post('/workflows/trigger')
  async triggerWorkflow(@Body() payload: any): Promise<void> {
    this.appService.startWorkflow();
  }
}
