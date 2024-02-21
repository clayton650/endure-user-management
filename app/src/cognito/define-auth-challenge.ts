import { DefineAuthChallengeTriggerEvent } from "aws-lambda";

export default async function handler(
  event: DefineAuthChallengeTriggerEvent,
): Promise<DefineAuthChallengeTriggerEvent> {
  /* eslint-disable no-param-reassign */
  console.log("DefineAuthChallengeTriggerEvent:", event);
  event.response.challengeName = "CUSTOM_CHALLENGE";
  event.response.issueTokens = false;
  event.response.failAuthentication = false;
  return event;
}
