import { Request } from 'express';
import { isString } from '@/src/utils/type_guards';
import { getIntFromString } from '@/src/utils/get_number_from_string';

export function pageAndPagination(request: Request): {
  page: number;
  pagination: number;
} {
  const pageQP = request.query?.page;
  const paginationQP = request.query?.pagination;

  const page = isString(pageQP) ? getIntFromString(pageQP, 1) : 1;
  const pagination = isString(paginationQP)
    ? getIntFromString(paginationQP, 10)
    : 10;

  return { page, pagination };
}
