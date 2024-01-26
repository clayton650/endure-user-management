import initBaseAuth from "./propelauth";
import SecretManagerError from "./SecretManagerError";
import UnauthorizedUserError from "./UnauthorizedUserError";

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
  _userId: UserId,
): Promise<UserAuthInfo> {
  try {
    const { validateAccessTokenAndGetUser } = await initBaseAuth();
    const propelUser = await validateAccessTokenAndGetUser(accessToken);

    // TODO: get cognito access token
    const cognitoAccessToken = "1234567890";

    const userMobile = "1-555-555-5555";

    // TODO: has paid bill (subscription level)

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

    console.log("Auth error:", error);
    throw error;
  }
}
