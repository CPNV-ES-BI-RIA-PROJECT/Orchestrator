import { Injectable, PipeTransform, BadRequestException, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class WorkflowValidationPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        if (metadata.type === 'custom' && !value) {
            throw new BadRequestException('File is required');
        }

        return value;
    }
}