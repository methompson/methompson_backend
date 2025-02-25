import { isNullOrUndefined } from '@/src/utils/type_guards';

export function budgetConfiguration() {
  const { BUDGET_SERVER_TYPE, BUDGET_FILE_PATH } = process.env;

  if (BUDGET_SERVER_TYPE === 'file' && !isNullOrUndefined(BUDGET_FILE_PATH)) {
    return {
      budgetType: 'file',
      budgetFilePath: BUDGET_FILE_PATH,
    };
  }

  return {
    budgetType: 'memory',
  };
}
