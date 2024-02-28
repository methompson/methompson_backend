import { InvalidInputError, NotFoundError } from '@/src/errors';
import { LoggerService } from '@/src/logger/logger.service';
import { HttpException, HttpStatus } from '@nestjs/common';

export async function commonErrorHandler(
  e: unknown,
  loggerService: LoggerService,
  options?: {
    notFoundErrorMessage?: string;
    invalidInputErrorMessage?: string;
    httpExceptionMessage?: string;
  },
): Promise<Error> {
  const notFoundErrorMessage = options?.notFoundErrorMessage ?? 'No User Found';
  const invalidInputErrorMessage =
    options?.invalidInputErrorMessage ?? 'Invalid Input';
  const httpExceptionMessage = options?.httpExceptionMessage ?? 'Server Error';

  if (e instanceof NotFoundError) {
    return new HttpException(notFoundErrorMessage, HttpStatus.NOT_FOUND);
  }
  if (e instanceof InvalidInputError) {
    return new HttpException(invalidInputErrorMessage, HttpStatus.BAD_REQUEST);
  }

  await loggerService.addErrorLog(e);

  return new HttpException(
    httpExceptionMessage,
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}
