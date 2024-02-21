import SecretManagerError from "../cognito/SecretManagerError";
import UnauthorizedUserError from "./UnauthorizedUserError";
import UserPoolClientError from "../cognito/UserPoolClientError";
import InternalServerError from "./InternalServerError";

type AccessToken = string;

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

export default async function auth(): Promise<UserAuthInfo> {
  try {
    const user = {
      id: "fake id",
      email: "fake email",
      firstName: "fake name",
      lastName: "fake password",
      mobile: "fake mobile",
      pictureUrl: "fake picture",
      humanVerified: true,
      lastSeen: "fake date",
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
