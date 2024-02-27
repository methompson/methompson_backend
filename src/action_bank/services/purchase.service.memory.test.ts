describe('InMemoryPurchaseService', () => {
  describe('purchases', () => {
    test('returns a copy of the purchases', () => {});

    test('if there are no purchases, it returns an empty object', () => {});

    test('revising the purchases object does not revise the stored version', () => {});
  });

  describe('purchasesList', () => {
    test('returns an array of purchases sorted by date', () => {});

    test('if there are no purchases, it returns an empty array', () => {});

    test('revising the purchasesList array does not revise the stored version', () => {});
  });

  describe('getPurchases', () => {
    test('returns an array of purchases', () => {});

    test('returns paginated purchases if there are more purchases than the pagination', () => {});

    test('goes to the proper page if a page and pagination are provided', () => {});

    test('returns an empty array if the page is beyond the range of purchases', () => {});

    test('returns an empty array if there are no purchases', () => {});

    test('returns an empty array if the user has no purchases', () => {});
  });

  describe('addPurchase', () => {
    test('adds a purchase to the purchases', () => {});
  });

  describe('updatePurchase', () => {
    test('replaces the purchase with a new purchase and returns the old purchase', () => {});

    test('throws an error if the purchase does not exist', () => {});
  });

  describe('deletePurchase', () => {
    test('deletes the purchase and returns the deleted purchase', () => {});

    test('throws an error if the purchase does not exist', () => {});
  });
});
