import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';

import { InvalidInputError, NotFoundError } from '@/src/errors';
import { LoggerService } from '@/src/logger/logger.service';

export async function commonErrorHandler(
  e: unknown,
  loggerService: LoggerService,
  options?: {
    notFoundErrorMessage?: string;
    invalidInputErrorMessage?: string;
    httpExceptionMessage?: string;
    notAuthorizedErrorMessage?: string;
  },
): Promise<Error> {
  const notFoundErrMsg = options?.notFoundErrorMessage ?? 'Not Found';
  const invalidInputErrMsg =
    options?.invalidInputErrorMessage ?? 'Invalid Input';
  const notAuthorizedErrMsg =
    options?.notAuthorizedErrorMessage ?? 'Not Authorized';
  const httpExceptionMsg = options?.httpExceptionMessage ?? 'Server Error';

  if (e instanceof NotFoundError) {
    return new HttpException(notFoundErrMsg, HttpStatus.NOT_FOUND);
  }
  if (e instanceof InvalidInputError) {
    return new HttpException(invalidInputErrMsg, HttpStatus.BAD_REQUEST);
  }
  if (e instanceof UnauthorizedException) {
    return new HttpException(notAuthorizedErrMsg, HttpStatus.UNAUTHORIZED);
  }

  await loggerService.addErrorLog(e);

  return new HttpException(httpExceptionMsg, HttpStatus.INTERNAL_SERVER_ERROR);
}
