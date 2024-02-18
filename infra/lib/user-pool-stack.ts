import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
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

    const userPoolClient = new UserPoolClient(this, "AppClient", {
      userPool,
      generateSecret: true,
    });

    this.userPoolArn = userPool.userPoolArn;
    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;
  }
}
