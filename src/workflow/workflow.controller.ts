import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { AllExceptionsFilter } from './filters/workflow.filter';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';

@Controller('/v1')
@UseFilters(AllExceptionsFilter)
export class WorkflowController {
  constructor(private readonly appService: WorkflowService) {}

  @Post('/workflows/trigger')
  @HttpCode(202)
  async triggerWorkflow(
    @Body(new ValidationPipe({ transform: true })) dto: TriggerWorkflowDto,
  ): Promise<void> {
    await this.appService.startWorkflow(dto.fileUrl);
  }
}
