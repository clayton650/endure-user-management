import { VerifyAuthChallengeResponseTriggerEvent } from "aws-lambda";
import { User } from "@propelauth/node";
import {
  GetSecretValueCommand,
  SecretsManager,
} from "@aws-sdk/client-secrets-manager";
import initBaseAuth from "./PropelAuthClient";
import CognitoUserPoolClient from "./CognitoUserPoolClient";
import SecretManagerError from "../auth/SecretManagerError";
import PropelAuthClient from "./PropelAuthClient";
import getUserAuthAPIKey from "./getUserAuthAPIKey";

type AccessToken = string;

const region = process.env.AWS_REGION as string;
const userPoolId = process.env.COGNITO_USER_POOL_ID as string;
const userPoolClientId = process.env.COGNITO_USER_POOL_CLIENT_ID as string;
const userAuthUrl = process.env.USER_AUTH_URL as string;

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
    const givenAnswer = event.request.challengeAnswer as AccessToken;

    const userAuthAPIKey = await getUserAuthAPIKey();
    const propelAuthClient = new PropelAuthClient(userAuthUrl, userAuthAPIKey);
    const propelUser = await propelAuthClient.getUser(givenAnswer);

    const cognitoUser = await cognitoUserPoolClient.getOrCreateUser(
      propelUser.email,
    );

    const isAnswerCorrect = !!cognitoUser;
    // eslint-disable-next-line no-param-reassign
    event.response.answerCorrect = isAnswerCorrect;
    return event;
  } catch (error) {
    console.log("There was an error verifying the PropelAuth Token", error);
    throw error;
  }
}
