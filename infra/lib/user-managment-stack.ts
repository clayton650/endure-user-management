import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Fn } from "aws-cdk-lib";

interface UserManagementProps extends cdk.StackProps {
  domainName: string;
  subDomain: string;
}

export default class UserManagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: UserManagementProps) {
    super(scope, id, props);

    const { domainName, subDomain } = props;

    const userManagementLambda = new cdk.aws_lambda.Function(
      this,
      "UserManagementFunction",
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        code: cdk.aws_lambda.Code.fromAsset("../../app"),
        handler: "login.default",
      },
    );

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

    const certificate =
      cdk.aws_certificatemanager.Certificate.fromCertificateArn(
        this,
        "Certificate",
        Fn.importValue("CertificateArn"),
      );

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
