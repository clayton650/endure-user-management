export enum ChallengeName {
  PROPELAUTH_TOKEN_CHALLENGE = "PROPELAUTH_TOKEN_CHALLENGE",
}

interface DefineAuthChallengeTriggerEventResponse {
  challengeName: ChallengeName;
  issueTokens: boolean;
  failAuthentication: boolean;
}

export default async function handler(): Promise<DefineAuthChallengeTriggerEventResponse> {
  return {
    challengeName: ChallengeName.PROPELAUTH_TOKEN_CHALLENGE,
    issueTokens: false,
    failAuthentication: false,
  };
}
