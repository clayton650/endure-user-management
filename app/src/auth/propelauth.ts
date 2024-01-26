import * as propelAuth from "@propelauth/node";
import {
  GetSecretValueCommand,
  SecretsManager,
} from "@aws-sdk/client-secrets-manager";
import SecretManagerError from "./SecretManagerError";

export default async function initBaseAuth() {
  const secretManagerClient = new SecretsManager({
    region: process.env.AWS_REGION,
  });
  const { SecretString } = await secretManagerClient.send(
    new GetSecretValueCommand({ SecretId: "prod-user-auth-api-key" }),
  );

  if (!SecretString) {
    throw new SecretManagerError("Secret is not a string");
  }

  const { userAuthAPIKey } = JSON.parse(SecretString);

  if (!userAuthAPIKey) {
    throw new SecretManagerError("Secret value can not be found");
  }

  // TODO: add env class wrapper that includes error message if env vars are missing

  return propelAuth.initBaseAuth({
    authUrl: process.env.PROPEL_AUTH_URL as string,
    apiKey: userAuthAPIKey,
  });
}
