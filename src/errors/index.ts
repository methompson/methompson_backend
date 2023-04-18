export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidStateError.prototype);
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidInputError.prototype);
  }
}
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class MutateDataException extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, MutateDataException.prototype);
  }
}

export class DatabaseNotAvailableException extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, DatabaseNotAvailableException.prototype);
  }
}
