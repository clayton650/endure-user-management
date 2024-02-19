import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  UserPool,
  UserPoolClient,
  UserPoolOperation,
} from "aws-cdk-lib/aws-cognito";
import { Function, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { Environment } from "aws-cdk-lib/core/lib/environment";

interface Env extends Environment {
  name: string;
}
interface Props extends cdk.StackProps {
  env: Env;
}

export default class UserPoolStack extends cdk.Stack {
  public readonly userPoolArn: string;

  public readonly userPoolId: string;

  public readonly userPoolClientId: string;

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

    const defineAuthChallengeLambda = new Function(
      this,
      "DefineAuthChallengeLambda",
      {
        runtime: Runtime.NODEJS_18_X,
        code: Code.fromAsset("../dist/index.zip"),
        handler: "index.defineAuthChallengeHandler",
      },
    );

    const verifyAuthChallengeResponseLambda = new Function(
      this,
      "VerifyAuthChallengeResponseLambda",
      {
        runtime: Runtime.NODEJS_18_X,
        code: Code.fromAsset("../dist/index.zip"),
        handler: "index.verifyAuthChallengeResponseHandler",
      },
    );

    userPool.addTrigger(
      UserPoolOperation.DEFINE_AUTH_CHALLENGE,
      defineAuthChallengeLambda,
    );

    userPool.addTrigger(
      UserPoolOperation.VERIFY_AUTH_CHALLENGE_RESPONSE,
      verifyAuthChallengeResponseLambda,
    );

    const userPoolClient = new UserPoolClient(this, "UserPoolClient", {
      userPool,
      generateSecret: true,
      authFlows: {
        custom: true,
      },
    });
  }
}
