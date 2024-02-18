import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminCreateUserCommand,
  ListUsersCommand,
  DescribeUserPoolClientCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import initBaseAuth from "./propelauth";
import SecretManagerError from "./SecretManagerError";
import UnauthorizedUserError from "./UnauthorizedUserError";
import UserPoolClientError from "./UserPoolClientError";

type AccessToken = string;
type UserId = string;

// TODO: move to common types
interface User {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  mobile?: string;
  pictureUrl: string;
  lastSeen?: string;
}

interface UserAuthInfo {
  accessToken: AccessToken;
  user: User;
}

function generateSecretHash(
  username: string,
  userPoolClientId: string,
  userPoolClientSecret: string,
) {
  const message = username + userPoolClientId;
  return crypto
    .createHmac("sha256", userPoolClientSecret)
    .update(message)
    .digest("base64");
}

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

async function retrieveUserPoolClientSecret(
  userPoolId: string,
  clientId: string,
) {
  const command = new DescribeUserPoolClientCommand({
    UserPoolId: userPoolId,
    ClientId: clientId,
  });

  try {
    const response = await client.send(command);

    // TODO: is the the correct way to control flow?
    if (!response.UserPoolClient?.ClientSecret) {
      throw new Error("User pool client secret not found.");
    }

    return response.UserPoolClient.ClientSecret;
  } catch (error) {
    throw new UserPoolClientError(
      `Error retrieving user pool client secret: ${error}`,
    );
  }
}

export default async function auth(
  accessToken: AccessToken,
  userId: UserId,
): Promise<UserAuthInfo> {
  try {
    // TODO: move PropelAuth validation to  to a separate lambda triggered by Cognito DefineAuthChallenge
    const { validateAccessTokenAndGetUser } = await initBaseAuth();
    const authHeader = `Bearer ${accessToken}`;
    const propelUser = await validateAccessTokenAndGetUser(authHeader);

    // TODO: is a userId check unnecessary? Do we even need to pass the userId?
    if (userId !== propelUser.userId) {
      throw new UnauthorizedUserError("Not the expected user");
    }

    // TODO: has paid bill (subscription level)

    // TODO: create cognito abstraction
    // Check if user exists in Cognito
    const userPoolId = process.env.USER_POOL_ID!;
    const userPoolClientId = process.env.USER_POOL_CLIENT_ID!;

    const userPoolClientSecret = await retrieveUserPoolClientSecret(
      userPoolId,
      userPoolClientId,
    );

    const listUsersCommand = new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: `username = "${propelUser.email}"`,
    });

    const usersResponse = await client.send(listUsersCommand);
    if (usersResponse.Users && usersResponse.Users.length === 0) {
      // User does not exist, create user
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: userId,
      });
      await client.send(createUserCommand);
    }
    // Authenticate the user in Cognito and get tokens
    const secretHash = generateSecretHash(
      userId,
      userPoolClientId,
      userPoolClientSecret,
    );
    const authCommand = new AdminInitiateAuthCommand({
      UserPoolId: userPoolId,
      ClientId: userPoolClientId,
      AuthFlow: "CUSTOM_AUTH",
      AuthParameters: {
        USERNAME: userId,
        SECRET_HASH: secretHash,
      },
    });

    const authResponse = await client.send(authCommand);

    // Assuming authResponse contains the tokens
    const cognitoAccessToken = authResponse.AuthenticationResult?.AccessToken;
    const userMobile = "1-555-555-5555";

    // TODO: move user related info to another endpoint/function?
    const user = {
      id: propelUser.userId,
      email: propelUser.email,
      firstName: propelUser.firstName!,
      lastName: propelUser.lastName!,
      mobile: userMobile,
      pictureUrl: propelUser.metadata?.pictureUrl,
      humanVerified: true,
      lastSeen: propelUser.metadata?.lastSeen?.toString(),
    };

    return {
      accessToken: cognitoAccessToken,
      user,
    };
  } catch (e) {
    const error = e as Error;
    if (error! instanceof SecretManagerError) {
      console.log("Auth error - UnauthorizedUserError:", error);
      throw new UnauthorizedUserError(`Unauthorized user: ${error.message}`);
    }

    if (error! instanceof UserPoolClientError) {
      console.log("Auth error - InternalServiceError:", error);
      throw new InternalServiceError(
        `User pool client error: ${error.message}`,
      );
    }

    console.log("Auth error:", error);
    throw error;
  }
}
