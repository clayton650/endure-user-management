type AccessToken = string;
type UserId = string;

interface UserInfo {
  id: string;
  email?: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  mobile?: string;
  mobileVerified: boolean;
  pictureUrl: string;
  humanVerified: boolean;
  enabled: boolean;
  lastSeen?: string;
}

interface UserAuthInfo {
  accessToken: AccessToken;
  userInfo: UserInfo;
}
export default async function auth(
  accessToken: AccessToken,
  userId: UserId,
): Promise<UserAuthInfo> {
  console.log("Access Token:", accessToken);
  console.log("User Id:", userId);

  return {
    accessToken: "1234567890",
    userInfo: {
      id: "ABC123",
      email: "claytonhthompson@gmail.com",
      firstName: "clayton",
      lastName: "thompson",
      emailVerified: true,
      mobile: undefined,
      mobileVerified: false,
      pictureUrl:
        "https://nwn.blogs.com/.a/6a00d8341bf74053ef0240a46b144f200c-800wi",
      humanVerified: true,
      enabled: true,
      lastSeen: Date.now().toString(),
    },
  };
}
