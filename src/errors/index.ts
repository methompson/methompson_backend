export class InvalidStateError extends Error {
  constructor(message?: string) {
    super(message ?? 'Invalid State');
    Object.setPrototypeOf(this, InvalidStateError.prototype);
  }
}

export class InvalidInputError extends Error {
  constructor(message?: string) {
    super(message ?? 'Invalid Input');
    Object.setPrototypeOf(this, InvalidInputError.prototype);
  }
}

export class NotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Not Found');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class MutateDataException extends Error {
  constructor(message?: string) {
    super(message ?? 'Cannot Mutate Data');
    Object.setPrototypeOf(this, MutateDataException.prototype);
  }
}

export class DatabaseNotAvailableException extends Error {
  constructor(message?: string) {
    super(message ?? 'Database Not Found');
    Object.setPrototypeOf(this, DatabaseNotAvailableException.prototype);
  }
}

export class UnimplementedError extends Error {
  constructor(message?: string) {
    super(message ?? 'Unimplemented');
    Object.setPrototypeOf(this, UnimplementedError.prototype);
  }
}
