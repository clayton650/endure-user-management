import { Environment } from "aws-cdk-lib/core/lib/environment";
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import * as path from "path";
import { Fn } from "aws-cdk-lib";

interface Env extends Environment {
  name: string;
}
interface Props extends cdk.StackProps {
  project: string;
  env: Env;
}

export default class UserManagementArtifactBucketStack extends cdk.Stack {
  artifactBucket: s3.IBucket;

  buildArtifactKey: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const { env, project } = props;

    this.artifactBucket = new s3.Bucket(this, "UserManagementArtifactBucket", {
      bucketName: `${env.name}-${project}-artifacts`,
      versioned: true,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Boostrap the bucket
    // TODO: get app values from app's package json?
    const bucketArtifactPath = "api/dist";
    const buildArtifactFileName = "index.zip";
    this.buildArtifactKey = `${bucketArtifactPath}/${buildArtifactFileName}`;
    const localBuildArtifactPath = path.join(
      __dirname,
      `../../app/dist/${buildArtifactFileName}`,
    );

    const bucketArtifactSource = cdk.aws_s3_deployment.Source.asset(
      localBuildArtifactPath,
    );

    const bootstrapArtifactSourceBucketDeployment =
      new cdk.aws_s3_deployment.BucketDeployment(
        this,
        "BootstrapArtifactSourceBucketDeployment",
        {
          sources: [bucketArtifactSource],
          destinationBucket: this.artifactBucket,
          destinationKeyPrefix: bucketArtifactPath,
          extract: false,
        },
      );

    const currentBuildArtifactFileName = Fn.select(
      0,
      bootstrapArtifactSourceBucketDeployment.objectKeys,
    );

    const originalBuildArtifactKey = `${bucketArtifactPath}/${currentBuildArtifactFileName}`;

    const renameBoostrapArtifactCustomResource =
      new cdk.custom_resources.AwsCustomResource(
        this,
        "RenameBoostrapArtifactCustomResource",
        {
          onCreate: {
            service: "S3",
            action: "copyObject",
            parameters: {
              Bucket: this.artifactBucket.bucketName,
              Key: this.buildArtifactKey,
              CopySource: `/${this.artifactBucket.bucketName}/${originalBuildArtifactKey}`,
            },
            physicalResourceId:
              cdk.custom_resources.PhysicalResourceId.of("RenamedObject"),
          },
          policy: cdk.custom_resources.AwsCustomResourcePolicy.fromStatements([
            new cdk.aws_iam.PolicyStatement({
              sid: "AllowCustomResourceToRenameArtifact",
              effect: cdk.aws_iam.Effect.ALLOW,
              actions: ["s3:GetObject", "s3:PutObject", "s3:CopyObject"],
              resources: [this.artifactBucket.arnForObjects("*")],
            }),
          ]),
        },
      );
    renameBoostrapArtifactCustomResource.node.addDependency(
      bootstrapArtifactSourceBucketDeployment,
    );

    const removeBoostrapArtifactCustomResource =
      new cdk.custom_resources.AwsCustomResource(
        this,
        "RemoveBoostrapArtifactCustomResource",
        {
          onCreate: {
            service: "S3",
            action: "deleteObject",
            parameters: {
              Bucket: this.artifactBucket.bucketName,
              Key: originalBuildArtifactKey,
            },
            physicalResourceId:
              cdk.custom_resources.PhysicalResourceId.of("DeleteObject"),
          },
          policy: cdk.custom_resources.AwsCustomResourcePolicy.fromStatements([
            new cdk.aws_iam.PolicyStatement({
              sid: "AllowCustomResourceToDeleteArtifact",
              effect: cdk.aws_iam.Effect.ALLOW,
              actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
              resources: [
                this.artifactBucket.arnForObjects(originalBuildArtifactKey),
              ],
            }),
          ]),
        },
      );
    removeBoostrapArtifactCustomResource.node.addDependency(
      renameBoostrapArtifactCustomResource,
    );
  }
}
