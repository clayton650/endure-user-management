import { VerifyAuthChallengeResponseTriggerEvent } from "aws-lambda";
import CognitoUserPoolClient from "./CognitoUserPoolClient";
import PropelAuthClient from "./PropelAuthClient";
import getUserAuthAPIKey from "./getUserAuthAPIKey";
import SecretManagerError from "./SecretManagerError";

type AccessToken = string;

const region = process.env.AWS_REGION as string;
const propelAuthAPIKeySecretName = process.env
  .PROPEL_AUTH_API_KEY_SECRET_NAME as string;
const propelAuthUrl = process.env.PROPEL_AUTH_URL as string;

// TODO: figure out a better way to handle these types of values, maybe parameter store?
// Also, the below values may all be in the event already so could just construct the client from the event
const userPoolId = "us-west-2_z8fBhK9tQ";
const userPoolClientId = "4a7pcsotio9qq31top5bc67eg5";

const cognitoUserPoolClient = new CognitoUserPoolClient(
  region,
  userPoolId,
  userPoolClientId,
);

export default async function handler(
  event: VerifyAuthChallengeResponseTriggerEvent,
): Promise<VerifyAuthChallengeResponseTriggerEvent> {
  try {
    // TODO: check challengeName and handle different types of challenges
    console.log("VerifyAuthChallengeResponseTriggerEvent", event);
    const givenAnswer = event.request.challengeAnswer as AccessToken;

    const { apiKey: propelAuthAPIKey } = await getUserAuthAPIKey(
      propelAuthAPIKeySecretName,
    );

    if (!propelAuthAPIKey) {
      throw new SecretManagerError(
        `Secret value can not be found with secret name: ${propelAuthAPIKeySecretName}`,
      );
    }

    const propelAuthClient = new PropelAuthClient(
      propelAuthUrl,
      propelAuthAPIKey,
    );
    const propelUser = await propelAuthClient.getUser(givenAnswer);

    const cognitoUser = await cognitoUserPoolClient.getOrCreateUser(
      propelUser.email,
    );

    const isAnswerCorrect = !!cognitoUser;
    /* eslint-disable no-param-reassign */
    event.response.answerCorrect = isAnswerCorrect;
  } catch (error) {
    console.log("There was an error verifying the PropelAuth Token", error);
    event.response.answerCorrect = false;
  }

  return event;
}
