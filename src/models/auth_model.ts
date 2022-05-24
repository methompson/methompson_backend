export class AuthModel {
  constructor(protected decodedToken: Record<string, unknown>) {}

  get token() {
    return {
      ...this.decodedToken,
    };
  }

  // TODO implement this based on token input
  get authorized(): boolean {
    return true;
  }
}
