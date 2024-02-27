import { DateTime } from 'luxon';

export interface GetPageOptions {
  page?: number;
  pagination?: number;
}

export interface GetActionBankUsersOptions extends GetPageOptions {
  userId?: string;
}

export interface GetPageAndUserOptions extends GetPageOptions {
  userId: string;
}

export interface PurchaseInputOptions extends GetPageOptions {
  userId: string;
  startDate?: DateTime;
  endDate?: DateTime;
  purchasePriceId?: string;
}

export interface DepositInputOptions extends GetPageOptions {
  userId: string;
  startDate?: DateTime;
  endDate?: DateTime;
  depositConversionId?: string;
}
