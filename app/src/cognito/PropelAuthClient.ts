import * as propelAuth from "@propelauth/node";
import {
  GetSecretValueCommand,
  SecretsManager,
} from "@aws-sdk/client-secrets-manager";
import { User } from "@propelauth/node";
import { initBaseAuth } from "@propelauth/node/dist/auth";
import SecretManagerError from "../auth/SecretManagerError";

type AccessToken = string;

interface Client {
  validateAccessTokenAndGetUser: (
    authorizationHeader?: string | undefined,
  ) => Promise<User>;
}

export default class PropelAuthClient {
  public readonly client: Client;

  public constructor(authUrl: string, apiKey: string) {
    this.client = propelAuth.initBaseAuth({
      authUrl,
      apiKey,
    });
  }

  public async getUser(accessToken: AccessToken): Promise<User> {
    try {
      const { validateAccessTokenAndGetUser } = this.client;
      const authHeader = `Bearer ${accessToken}`;
      const user = await validateAccessTokenAndGetUser(authHeader);
      return user;
    } catch (error) {
      console.log("There was an error verifying the PropelAuth Token", error);
      throw error;
    }
  }
}