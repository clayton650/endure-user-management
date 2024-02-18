import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import initBaseAuth from "../cognito/propelauth";
import SecretManagerError from "./SecretManagerError";
import UnauthorizedUserError from "./UnauthorizedUserError";
import UserPoolClientError from "../cognito/UserPoolClientError";
import InternalServerError from "./InternalServerError";

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
      accessToken: "ABC123",
      user,
    };
  } catch (e) {
    const error = e as Error;
    if (error! instanceof SecretManagerError) {
      console.log("Auth error - UnauthorizedUserError:", error);
      throw new UnauthorizedUserError(`Unauthorized user: ${error.message}`);
    }

    if (error! instanceof UserPoolClientError) {
      console.log("Auth error - InternalServerError:", error);
      throw new InternalServerError(`User pool client error: ${error.message}`);
    }

    console.log("Auth error:", error);
    throw error;
  }
}
