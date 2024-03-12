import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { Environment } from "aws-cdk-lib/core/lib/environment";

interface EnvProps extends Environment {
  name: string;
  region: string;
}
interface Props extends cdk.StackProps {
  project: string;
  allowMethods: HttpMethod[];
  domainName: string;
  subDomain: string;
  env: EnvProps;
}
export default class UserManagementAPIStack extends cdk.Stack {
  public readonly api: cdk.aws_apigateway.RestApi;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const { domainName, subDomain, env, allowMethods } = props;

    let allowOrigins = [`https://www.${domainName}`];
    if (env.name === "dev") {
      // TODO: is there a better way to support local development?
      const developmentAllowOrigins = [
        "http://localhost:5173",
        "http://dev.localhost:5173",
      ];
      allowOrigins = [...allowOrigins, ...developmentAllowOrigins];
    }

    const api = new cdk.aws_apigateway.RestApi(this, "UserManagementApi", {
      restApiName: `${props.project}-${env.name}`,
      defaultCorsPreflightOptions: {
        allowOrigins,
        allowHeaders: cdk.aws_apigateway.Cors.DEFAULT_HEADERS,
        allowMethods,
      },
    });

    const envSubDomain =
      env.name === "prod" ? subDomain : `${subDomain}.${env.name}`;

    const envDomainName = `${envSubDomain}.${domainName}`;

    const servicesCertificateArn = cdk.Fn.importValue(
      `endure-services-dns-certificate-arn`,
    );

    const servicesCertificate =
      cdk.aws_certificatemanager.Certificate.fromCertificateArn(
        this,
        "ServicesCertificate",
        servicesCertificateArn,
      );

    const apiGatewayDomainName = new cdk.aws_apigateway.DomainName(
      this,
      "CustomDomain",
      {
        domainName: envDomainName,
        certificate: servicesCertificate,
      },
    );

    new cdk.aws_apigateway.BasePathMapping(this, "BasePathMapping", {
      domainName: apiGatewayDomainName,
      restApi: api,
    });

    const hostedZone = cdk.aws_route53.HostedZone.fromLookup(
      this,
      "HostedZone",
      {
        domainName,
      },
    );

    new cdk.aws_route53.ARecord(this, "APIGatewayAliasRecord", {
      zone: hostedZone,
      target: cdk.aws_route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.ApiGatewayDomain(apiGatewayDomainName),
      ),
      recordName: envSubDomain,
    });

    this.api = api;
  }
}
