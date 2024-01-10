import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CfnOutput } from "aws-cdk-lib";
import { Environment } from "aws-cdk-lib/core/lib/environment";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";

interface UserManagementEnvProps extends Environment {
  name: string;
}
interface UserManagementProps extends cdk.StackProps {
  project: string;
  domainName: string;
  subDomain: string;
  env: UserManagementEnvProps;
}

export default class UserManagementStack extends cdk.Stack {
  public readonly artifactBucket: s3.IBucket;

  constructor(scope: Construct, id: string, props: UserManagementProps) {
    super(scope, id, props);

    const { domainName, subDomain, env, project } = props;

    this.artifactBucket = new cdk.aws_s3.Bucket(
      this,
      "UserManagementArtifactBucket",
      {
        bucketName: `${project}-artifact-bucket`,
        versioned: true,
        encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      },
    );

    // boostrap bucket with latest build
    // TODO: should we check to see if the bucket is empty?
    const bucketArtifactPath = "api/dist";
    const buildArtifactFileName = "index.zip";
    const localBuildArtifactPath = path.join(
      __dirname,
      `../../app/dist/${buildArtifactFileName}`,
    );
    new cdk.aws_s3_deployment.BucketDeployment(this, "DeployLambdaCode", {
      sources: [cdk.aws_s3_deployment.Source.asset(localBuildArtifactPath)],
      destinationBucket: this.artifactBucket,
      destinationKeyPrefix: bucketArtifactPath,
    });

    const userManagementLambda = new cdk.aws_lambda.Function(
      this,
      "UserManagementFunction",
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        code: cdk.aws_lambda.Code.fromBucket(
          this.artifactBucket,
          `${bucketArtifactPath}/${buildArtifactFileName}`,
        ),
        handler: "index.handler",
      },
    );

    const policyStatement = new cdk.aws_iam.PolicyStatement({
      sid: "AllowLambdaToGetAPIArtifact",
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: ["s3:GetObject"],
      resources: [this.artifactBucket.arnForObjects(`${bucketArtifactPath}/*`)],
    });
    userManagementLambda.addToRolePolicy(policyStatement);

    const api = new cdk.aws_apigateway.LambdaRestApi(
      this,
      "UserManagementApi",
      {
        handler: userManagementLambda,
        proxy: false,
      },
    );
    const loginResource = api.root.addResource("login");
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
