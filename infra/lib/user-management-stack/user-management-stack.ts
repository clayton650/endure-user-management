import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Environment } from "aws-cdk-lib/core/lib/environment";
import { HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import UserManagementAPIStack from "./user-management-api-stack";

interface EnvProps extends Environment {
  name: string;
  region: string;
}
interface Props extends cdk.StackProps {
  project: string;
  domainName: string;
  subDomain: string;
  env: EnvProps;
}

export default class UserManagementStack extends cdk.Stack {
  public readonly lambdaFunctionName: string;

  public readonly lambdaFunctionArn: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const { domainName, subDomain, env, project } = props;

    const { api } = new UserManagementAPIStack(this, `${id}-APIStack`, {
      project,
      env,
      domainName,
      subDomain,
      allowMethods: [HttpMethod.GET],
    });

    const getUserDetailsLambda = new cdk.aws_lambda.Function(
      this,
      `${id}-GetUserDetailsLambda`,
      {
        functionName: `${project}-${env.name}-get-user-details`,
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        code: cdk.aws_lambda.Code.fromAsset("../api/dist/index.zip"),
        handler: "index.getUserDetailsHandler",
        environment: {
          ENV_NAME: env.name,
        },
      },
    );

    this.lambdaFunctionName = getUserDetailsLambda.functionName;
    this.lambdaFunctionArn = getUserDetailsLambda.functionArn;

    const getUserDetailsLambdaIntegration =
      new cdk.aws_apigateway.LambdaIntegration(getUserDetailsLambda);
    const detailsResource = api.root.addResource("details");
    detailsResource.addMethod(HttpMethod.GET, getUserDetailsLambdaIntegration);
  }
}
