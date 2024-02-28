import { isNullOrUndefined } from '@/src/utils/type_guards';

export function actionBankConfiguration() {
  const { ACTION_BANK_SERVER_TYPE, ACTION_BANK_FILE_PATH } = process.env;

  if (
    ACTION_BANK_SERVER_TYPE === 'file' &&
    !isNullOrUndefined(ACTION_BANK_FILE_PATH)
  ) {
    return {
      actionBankType: 'file',
      actionBankFilePath: ACTION_BANK_FILE_PATH,
    };
  }

  return {
    actionBankType: 'memory',
  };
}
