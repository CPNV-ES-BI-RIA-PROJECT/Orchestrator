import { ArgumentsHost, ConflictException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from '../../src/workflow/filters/workflow.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let status: jest.Mock;
  let json: jest.Mock;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    filter = new AllExceptionsFilter();
  });

  it('should forward HttpException status and payload', () => {
    const exception = new ConflictException(
      'Request has already been processed.',
    );
    const host = createHttpArgumentsHost(status);

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(exception.getResponse());
  });

  it('should map unexpected errors to a workflow-specific 500 response', () => {
    const exception = new Error('Unexpected failure');
    const host = createHttpArgumentsHost(status);

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Workflow failed unexpectedly',
    });
  });
});

function createHttpArgumentsHost(status: jest.Mock): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
    }),
  } as ArgumentsHost;
}
