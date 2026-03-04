import {
  Controller,
  HttpCode,
  Post,
  UseFilters,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkflowService } from './workflow.service';
import { WorkflowValidationPipe } from './pipes/workflow-validation.pipe';
import { AllExceptionsFilter } from './filters/workflow.filter';

@Controller('/v1')
@UseFilters(AllExceptionsFilter)
export class WorkflowController {
  constructor(private readonly appService: WorkflowService) {}

  @Post('/workflows/trigger')
  @HttpCode(202)
  @UseInterceptors(FileInterceptor('file'))
  async triggerWorkflow(
    @UploadedFile(new WorkflowValidationPipe()) file: Express.Multer.File,
  ): Promise<void> {
    await this.appService.startWorkflow(file);
  }
}
