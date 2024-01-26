export default class SecretManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecretManagerError";
  }
}
