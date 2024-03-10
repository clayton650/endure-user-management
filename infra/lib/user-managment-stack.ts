import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CfnOutput } from "aws-cdk-lib";
import { Environment } from "aws-cdk-lib/core/lib/environment";

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
        code: cdk.aws_lambda.Code,
        handler: "index.getUserDetailsHandler",
        environment: {
          ENV_NAME: env.name,
        },
      },
    );

    this.lambdaFunctionName = getUserDetailsLambda.functionName;
    this.lambdaFunctionArn = getUserDetailsLambda.functionArn;

    // TODO: add condition to limit localhost alllowOrigin to dev
    // TODO: limit methods to only those you need?
    const api = new cdk.aws_apigateway.LambdaRestApi(
      this,
      "UserManagementApi",
      {
        handler: getUserDetailsLambda,
        proxy: false,
        defaultCorsPreflightOptions: {
          allowOrigins: [`https://www.${domainName}`, "http://localhost:5173"],
          allowHeaders: cdk.aws_apigateway.Cors.DEFAULT_HEADERS,
          allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
        },
      },
    );

    const loginResource = api.root.addResource("details");
    loginResource.addMethod("GET");

    const hostedZone = cdk.aws_route53.HostedZone.fromLookup(
      this,
      "HostedZone",
      {
        domainName,
      },
    );

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

    const apiGatewayDomainName = new cdk.aws_apigateway.DomainName(
      this,
      "CustomDomain",
      {
        domainName: `${subDomain}.${domainName}`,
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
      recordName: "user",
    });
  }
}
