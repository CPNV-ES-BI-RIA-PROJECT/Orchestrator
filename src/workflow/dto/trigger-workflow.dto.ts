import { IsUrl, IsNotEmpty } from 'class-validator';

export class TriggerWorkflowDto {
  @IsNotEmpty()
  @IsUrl({}, { message: 'Must be a valid URL pointing to a file' })
  fileUrl: string;
}
