import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  InternalServerErrorException,
  Post,
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { AllExceptionsFilter } from './filters/workflow.filter';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AxiosError } from 'axios';

@ApiTags('Workflows')
@Controller('/v1')
@UseFilters(AllExceptionsFilter)
export class WorkflowController {
  constructor(private readonly appService: WorkflowService) {}

  @Post('/workflows/trigger')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Trigger a new ETL workflow',
    description:
      'Starts an asynchronous workflow process using the provided file URL.',
  })
  @ApiBody({ type: TriggerWorkflowDto })
  @ApiAcceptedResponse({
    description: 'Workflow trigger accepted and process started.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data, such as an invalid file URL.',
  })
  async triggerWorkflow(
    @Body(new ValidationPipe({ transform: true })) dto: TriggerWorkflowDto,
  ): Promise<void> {
    try {
      await this.appService.startWorkflow(dto.url);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Workflow failed unexpectedly');
    }
  }
}
