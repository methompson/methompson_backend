import { isNullOrUndefined } from '@/src/utils/type_guards';

export function viceBankConfiguration() {
  const { VICE_BANK_SERVER_TYPE, VICE_BANK_FILE_PATH } = process.env;

  if (
    VICE_BANK_SERVER_TYPE === 'file' &&
    !isNullOrUndefined(VICE_BANK_FILE_PATH)
  ) {
    return {
      viceBankType: 'file',
      viceBankFilePath: VICE_BANK_FILE_PATH,
    };
  }

  return {
    viceBankType: 'memory',
  };
}
