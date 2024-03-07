export interface GetPageOptions {
  page?: number;
  pagination?: number;
}

export interface GetViceBankUsersOptions extends GetPageOptions {
  userId?: string;
}

export interface GetPageAndUserOptions extends GetPageOptions {
  userId: string;
}

export interface PurchaseInputOptions extends GetPageOptions {
  userId: string;
  startDate?: string;
  endDate?: string;
  purchasePriceId?: string;
}

export interface DepositInputOptions extends GetPageOptions {
  userId: string;
  startDate?: string;
  endDate?: string;
  depositConversionId?: string;
}
