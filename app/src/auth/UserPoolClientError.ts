export default class UserPoolClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserPoolClientError";
  }
}
