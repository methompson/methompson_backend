describe('Budget Controller', () => {
  describe('getBudgets', () => {
    test('gets actions from the ActionsService', async () => {});
    test('throws an error if the userId is not a string', async () => {});
    test('throws an error if getActions throws an error', async () => {});
  });

  describe('addBudget', () => {
    test('adds a deposit conversion using the ActionsService', async () => {});

    test('throws an error if the body is not a record', async () => {});

    test('throws an error if the body cannot be parsed', async () => {});

    test('throws an error if addAction throws an error', async () => {});
  });

  describe('updateBudget', () => {
    test('updates a deposit conversion using the ActionsService', async () => {});
    test('throws an error if the body is not a record', async () => {});
    test('throws an error if the body cannot be parsed', async () => {});
    test('throws an error if updateAction throws an error', async () => {});
  });

  describe('deleteBudget', () => {
    test('deletes a deposit conversion using the ActionsService', async () => {});
    test('throws an error if the userId is not a string', async () => {});
    test('throws an error if deleteAction throws an error', async () => {});
  });

  describe('getCategories', () => {});
  describe('addCategory', () => {});
  describe('updateCategory', () => {});
  describe('deleteCategory', () => {});

  describe('getExpenses', () => {});
  describe('addExpense', () => {});
  describe('updateExpense', () => {});
  describe('deleteExpense', () => {});

  describe('getDeposits', () => {});
  describe('addDeposit', () => {});
  describe('updateDeposit', () => {});
  describe('deleteDeposit', () => {});

  describe('getWithdrawals', () => {});
  describe('addWithdrawal', () => {});
  describe('updateWithdrawal', () => {});
  describe('deleteWithdrawal', () => {});
});
