import {
  GetSecretValueCommand,
  SecretsManager,
} from "@aws-sdk/client-secrets-manager";
import SecretManagerError from "../auth/SecretManagerError";

export default async function getUserAuthAPIKey() {
  const secretManagerClient = new SecretsManager({
    region: process.env.AWS_REGION,
  });
  const { SecretString } = await secretManagerClient.send(
    // TODO: why is this secret id reference cognito?
    new GetSecretValueCommand({ SecretId: "prod-user-cognito-api-key" }),
  );

  if (!SecretString) {
    throw new SecretManagerError("Secret is not a string");
  }

  const { userAuthAPIKey } = JSON.parse(SecretString);

  if (!userAuthAPIKey) {
    throw new SecretManagerError("Secret value can not be found");
  }

  return userAuthAPIKey;
}
