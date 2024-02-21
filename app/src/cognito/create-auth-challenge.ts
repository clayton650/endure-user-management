import { CreateAuthChallengeTriggerEvent } from "aws-lambda";

export enum ChallengeName {
  PROPELAUTH_TOKEN_CHALLENGE = "PROPELAUTH_TOKEN_CHALLENGE",
}
export default async function handler(
  event: CreateAuthChallengeTriggerEvent,
): Promise<CreateAuthChallengeTriggerEvent> {
  console.log("CreateAuthChallengeTriggerEvent", event);
  event.response.publicChallengeParameters = {};
  event.response.privateChallengeParameters = {};
  event.response.privateChallengeParameters.answer = "true";
  event.response.challengeMetadata = ChallengeName.PROPELAUTH_TOKEN_CHALLENGE;
  return event;
}
