export default class UnauthorizedUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedUserError";
  }
}
