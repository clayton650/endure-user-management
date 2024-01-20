import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CfnOutput } from "aws-cdk-lib";
import { Environment } from "aws-cdk-lib/core/lib/environment";
import * as s3 from "aws-cdk-lib/aws-s3";

interface UserManagementEnvProps extends Environment {
  name: string;
}
interface UserManagementProps extends cdk.StackProps {
  project: string;
  domainName: string;
  subDomain: string;
  artifactBucket: s3.IBucket;
  apiBuildBucketKey: string;
  env: UserManagementEnvProps;
}

export default class UserManagementStack extends cdk.Stack {
  public readonly lambdaFunctionName: string;

  public readonly lambdaFunctionArn: string;

  constructor(scope: Construct, id: string, props: UserManagementProps) {
    super(scope, id, props);

    const { domainName, subDomain, env, artifactBucket, apiBuildBucketKey } =
      props;

    const userManagementLambda = new cdk.aws_lambda.Function(
      this,
      "UserManagementFunction",
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        code: cdk.aws_lambda.Code.fromBucket(artifactBucket, apiBuildBucketKey),
        handler: "index.loginHandler",
      },
    );

    this.lambdaFunctionName = userManagementLambda.functionName;
    this.lambdaFunctionArn = userManagementLambda.functionArn;

    const api = new cdk.aws_apigateway.LambdaRestApi(
      this,
      "UserManagementApi",
      {
        handler: userManagementLambda,
        proxy: false,
      },
    );
    const loginResource = api.root.addResource("auth");
    loginResource.addMethod("POST");

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
