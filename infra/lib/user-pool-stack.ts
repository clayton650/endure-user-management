import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  UserPool,
  UserPoolClient,
  UserPoolOperation,
} from "aws-cdk-lib/aws-cognito";
import { Function, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { Environment } from "aws-cdk-lib/core/lib/environment";
import { SecretValue } from "aws-cdk-lib";

interface Env extends Environment {
  name: string;
}
interface Props extends cdk.StackProps {
  env: Env;
}

export default class UserPoolStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const { env } = props;

    const userPool = new UserPool(this, "UserPool", {
      userPoolName: `${env.name}-user-pool`,
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
    });

    new UserPoolClient(this, "UserPoolClient", {
      userPool,
      authFlows: {
        custom: true,
      },
    });

    const lambdaDistPath = "../app/dist/index.zip";

    const defineAuthChallengeLambda = new Function(
      this,
      "DefineAuthChallengeLambda",
      {
        runtime: Runtime.NODEJS_18_X,
        code: Code.fromAsset(lambdaDistPath),
        handler: "index.defineAuthChallengeHandler",
      },
    );

    const createAuthChallengeLambda = new Function(
      this,
      "CreateAuthChallengeLambda",
      {
        runtime: Runtime.NODEJS_18_X,
        code: Code.fromAsset(lambdaDistPath),
        handler: "index.createAuthChallengeHandler",
      },
    );

    const propelAuthAPIKeySecretName = `${env.name}-propel-auth-api-key`;

    const propelAuthAPIKeySecret = new cdk.aws_secretsmanager.Secret(
      this,
      "UserAuthAPIKeySecret",
      {
        secretName: propelAuthAPIKeySecretName,
        secretObjectValue: {
          apiKey: SecretValue.unsafePlainText(
            "fake-api-key-that-should-be-update-in-secrets-manager",
          ),
        },
      },
    );

    const verifyAuthChallengeResponseLambda = new Function(
      this,
      "VerifyAuthChallengeResponseLambda",
      {
        runtime: Runtime.NODEJS_18_X,
        code: Code.fromAsset(lambdaDistPath),
        handler: "index.verifyAuthChallengeResponseHandler",
        environment: {
          PROPEL_AUTH_API_KEY_SECRET_NAME: propelAuthAPIKeySecretName,
          PROPEL_AUTH_URL: "https://auth.letsendure.com",
        },
      },
    );

    propelAuthAPIKeySecret.grantRead(verifyAuthChallengeResponseLambda);

    userPool.addTrigger(
      UserPoolOperation.DEFINE_AUTH_CHALLENGE,
      defineAuthChallengeLambda,
    );

    userPool.addTrigger(
      UserPoolOperation.CREATE_AUTH_CHALLENGE,
      createAuthChallengeLambda,
    );

    userPool.addTrigger(
      UserPoolOperation.VERIFY_AUTH_CHALLENGE_RESPONSE,
      verifyAuthChallengeResponseLambda,
    );
  }
}
