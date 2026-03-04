import { BadRequestException } from '@nestjs/common';

import {WorkflowValidationPipe} from "../../../src/workflow/pipes/workflow-validation.pipe";

describe('WorkflowValidationPipe', () => {
    const pipe = new WorkflowValidationPipe();

    it('should throw BadRequestException if file is missing', () => {
        expect(() => pipe.transform(undefined, { type: 'custom' }))
            .toThrow(BadRequestException);
    });

    it('should pass if file exists', () => {
        const mockFile = { originalname: 'test.pdf' };
        expect(pipe.transform(mockFile, { type: 'custom' })).toEqual(mockFile);
    });
});