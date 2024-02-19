import {
  AdminCreateUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersResponse,
  UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import UserPoolClientError from "./UserPoolClientError";

type Region = string;
type UserPoolId = string;
type ClientId = string;
type Email = string;
export default class CognitoUserPoolClient {
  private readonly client: CognitoIdentityProviderClient;

  private readonly userPoolId: UserPoolId;

  private readonly userPoolClientId: ClientId;

  public constructor(
    region: Region,
    userPoolId: UserPoolId,
    userPoolClientId: ClientId,
  ) {
    this.userPoolId = userPoolId;
    this.userPoolClientId = userPoolClientId;
    this.client = new CognitoIdentityProviderClient({
      region,
    });
  }

  private async listUsers(email: Email): Promise<UserType[]> {
    const command = new ListUsersCommand({
      UserPoolId: this.userPoolId,
      Filter: `username = "${email}"`,
    });
    const response: ListUsersResponse = await this.client.send(command);
    return response.Users || [];
  }

  private async createUser(email: Email): Promise<UserType> {
    const command = new AdminCreateUserCommand({
      UserPoolId: this.userPoolId,
      Username: email,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
      ],
    });

    const response = await this.client.send(command);
    if (!response.User) {
      throw new UserPoolClientError(`Error creating user (${email})`);
    }

    console.log(`Successfully created user: ${email}`);

    return response.User;
  }

  private static cleanInput(text: string): string {
    return text.toLowerCase().trim();
  }

  public async getOrCreateUser(email: Email): Promise<UserType> {
    const cleanEmail = CognitoUserPoolClient.cleanInput(email);

    const users = await this.listUsers(cleanEmail);
    if (users.length > 0) {
      console.log(`User ${cleanEmail} already exists`);
      return users[0];
    }
    return this.createUser(cleanEmail);
  }

  // private async getSecret(): Promise<Secret> {
  //   const command = new DescribeUserPoolClientCommand({
  //     UserPoolId: this.userPoolId,
  //     ClientId: this.userPoolClientId,
  //   });
  //
  //   const response = await this.client.send(command);
  //
  //   if (!response.UserPoolClient?.ClientSecret) {
  //     throw new UserPoolClientError("User pool client secret not found.");
  //   }
  //
  //   return response.UserPoolClient.ClientSecret;
  // }

  // private async generateSecretHash(username: Username): Promise<Hash> {
  //   const userPoolSecret = await this.getSecret();
  //   const message = username + this.userPoolClientId;
  //   return crypto
  //     .createHmac("sha256", userPoolSecret)
  //     .update(message)
  //     .digest("base64");
  // }

  // public async getUserAccessToken(username: Username): Promise<AccessToken> {
  //   const cleanUsername = CognitoUserPoolClient.cleanInput(username);
  //
  //   const user = await this.getOrCreateUser(cleanUsername);
  //
  //   if (!user.Username) {
  //     throw new UserPoolClientError(
  //       `Username for user not found. User: ${JSON.stringify(user)}`,
  //     );
  //   }
  //
  //   const command = new AdminInitiateAuthCommand({
  //     UserPoolId: this.userPoolId,
  //     ClientId: this.userPoolClientId,
  //     AuthFlow: "CUSTOM_AUTH",
  //     AuthParameters: {
  //       USERNAME: user.Username,
  //       SECRET_HASH: await this.generateSecretHash(username),
  //     },
  //   });
  //
  //   const response = await this.client.send(command);
  //
  //   if (!response.AuthenticationResult?.AccessToken) {
  //     throw new UserPoolClientError("Access token not found.");
  //   }
  //
  //   return response.AuthenticationResult.AccessToken;
  // }
}
