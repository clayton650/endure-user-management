import {
  GetSecretValueCommand,
  SecretsManager,
} from "@aws-sdk/client-secrets-manager";
import SecretManagerError from "./SecretManagerError";

type SecretName = string;
export default async function getSecret(
  secretName: SecretName,
): Promise<Record<string, string>> {
  const secretManagerClient = new SecretsManager({
    region: process.env.AWS_REGION,
  });
  const { SecretString } = await secretManagerClient.send(
    new GetSecretValueCommand({ SecretId: secretName }),
  );

  if (!SecretString) {
    throw new SecretManagerError("Secret is not a string");
  }

  return JSON.parse(SecretString);
}
