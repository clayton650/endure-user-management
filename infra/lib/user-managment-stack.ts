import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CfnOutput } from "aws-cdk-lib";
import { Environment } from "aws-cdk-lib/core/lib/environment";
import { HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";

interface UserManagementEnvProps extends Environment {
  name: string;
  region: string;
}
interface UserManagementProps extends cdk.StackProps {
  project: string;
  domainName: string;
  subDomain: string;
  env: UserManagementEnvProps;
}

export default class UserManagementStack extends cdk.Stack {
  public readonly lambdaFunctionName: string;

  public readonly lambdaFunctionArn: string;

  constructor(scope: Construct, id: string, props: UserManagementProps) {
    super(scope, id, props);

    const { domainName, subDomain, env } = props;

    const getUserDetailsLambda = new cdk.aws_lambda.Function(
      this,
      "UserManagementFunction",
      {
        functionName: `${props.project}-${env.name}-get-user-details`,
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

    let allowOrigins = [`https://www.${domainName}`];
    if (env.name === "dev") {
      // TODO: is there a better way to support local development?
      const developmentAllowOrigins = [
        "http://localhost:5173",
        "http://dev.localhost:5173",
      ];
      allowOrigins = [...allowOrigins, ...developmentAllowOrigins];
    }

    const allowMethods = [HttpMethod.GET];

    const api = new cdk.aws_apigateway.RestApi(this, "UserManagementApi", {
      restApiName: `${props.project}-${env.name}`,
      defaultCorsPreflightOptions: {
        allowOrigins,
        allowHeaders: cdk.aws_apigateway.Cors.DEFAULT_HEADERS,
        allowMethods,
      },
    });

    const getUserDetailsLambdaIntegration =
      new cdk.aws_apigateway.LambdaIntegration(getUserDetailsLambda);
    const detailsResource = api.root.addResource("details");
    detailsResource.addMethod(HttpMethod.GET, getUserDetailsLambdaIntegration);

    const hostedZone = cdk.aws_route53.HostedZone.fromLookup(
      this,
      "HostedZone",
      {
        domainName,
      },
    );

    // TODO: does this cert belong here? Seem generic to be moved to a different stack
    const certificate = new cdk.aws_certificatemanager.DnsValidatedCertificate(
      this,
      "ServicesCertificate",
      {
        domainName,
        subjectAlternativeNames: [`*.${domainName}`],
        hostedZone,
        validation:
          cdk.aws_certificatemanager.CertificateValidation.fromDns(hostedZone),
      },
    );

    new CfnOutput(this, "CertificateArn ", {
      exportName: `endure-${env.name}-${env.region}-domain-dns-certificate-arn`,
      value: certificate.certificateArn,
    });

    const envSubDomain =
      env.name === "prod" ? subDomain : `${subDomain}.${env.name}`;

    const envDomainName = `${envSubDomain}.${domainName}`;

    const apiGatewayDomainName = new cdk.aws_apigateway.DomainName(
      this,
      "CustomDomain",
      {
        domainName: envDomainName,
        certificate,
      },
    );

    new cdk.aws_apigateway.BasePathMapping(this, "BasePathMapping", {
      domainName: apiGatewayDomainName,
      restApi: api,
    });

    new cdk.aws_route53.ARecord(this, "APIGatewayAliasRecord", {
      zone: hostedZone,
      target: cdk.aws_route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.ApiGatewayDomain(apiGatewayDomainName),
      ),
      recordName: envSubDomain,
    });
  }
}
