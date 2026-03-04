import {WorkflowContext} from "../../../src/workflow/models/workflow-context.model";

describe('WorkflowContext', () => {
    const mockFile = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from('data'),
        size: 4,
    } as Express.Multer.File;

    it('should initialize with correlationId, payload, and metadata', () => {
        const correlationId = '123-abc';

        const context = new WorkflowContext(correlationId, mockFile);

        expect(context.correlationId).toBe(correlationId);
        expect(context.payload).toEqual(mockFile);
    });

    it('should be immutable at runtime', () => {
        const context = new WorkflowContext('123', mockFile);

        expect(() => {
            (context as any).correlationId = 'new-id';
        }).toThrow(TypeError);

        expect(() => {
            (context.payload as any).originalname = 'hacked.csv';
        }).toThrow(TypeError);

        expect(() => {
            (context.metadata as any)['newKey'] = 'value';
        }).toThrow(TypeError);
    });
});