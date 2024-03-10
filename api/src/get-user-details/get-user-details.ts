type UserId = string;
interface GetUserDetails {
  email?: string;
  firstName: string;
  lastName: string;
  mobile?: string;
  pictureUrl: string;
  humanVerified: boolean;
  lastSeen?: string;
}

export default async function getUserDetails(
  userId: UserId,
): Promise<GetUserDetails> {
  console.log("getting userDetails for userId:", userId);
  try {
    return {
      email: "fake@email.com",
      firstName: "keanu",
      lastName: "reeves",
      mobile: "888-123-4567",
      pictureUrl: "https://placekeanu.com/200/150",
      humanVerified: true,
      lastSeen: Date.now().toString(),
    };
  } catch (e) {
    const error = e as Error;
    console.log("Auth error:", error);
    throw error;
  }
}
