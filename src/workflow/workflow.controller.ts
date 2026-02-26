import {Body, Controller, Post, UseFilters} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import {AllExceptionsFilter} from "./workflow.filter";

@Controller('/v1')
@UseFilters(AllExceptionsFilter)
export class WorkflowController {
  constructor(private readonly appService: WorkflowService) {}

  @Post('/workflows/trigger')
  async triggerWorkflow(@Body() payload: any): Promise<void> {
    this.appService.startWorkflow(payload);
  }
}
