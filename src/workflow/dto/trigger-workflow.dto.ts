import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TriggerWorkflowDto {
  @ApiProperty({
    description:
      'The URL pointing to the file required to trigger the workflow',
    example: 'https://example.com/data/payload.csv',
  })
  @IsNotEmpty()
  @IsUrl({}, { message: 'Must be a valid URL pointing to a file' })
  fileUrl: string;
}
