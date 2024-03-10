import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Environment } from "aws-cdk-lib/core/lib/environment";
import * as path from "path";
import * as s3 from "aws-cdk-lib/aws-s3";

interface UserManagementEnvProps extends Environment {
  name: string;
}
interface Props extends cdk.StackProps {
  project: string;
  repo: string;
  branch: string;
  artifactBucket: s3.IBucket;
  apiBuildBucketKey: string;
  lambdaFunctionName: string;
  lambdaFunctionArn: string;
  env: UserManagementEnvProps;
}
export default class UserManagementPipeline extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const {
      project,
      env,
      repo,
      branch,
      lambdaFunctionName,
      lambdaFunctionArn,
    } = props;

    const sourceArtifact = new cdk.aws_codepipeline.Artifact("SourceArtifact");
    const buildArtifact = new cdk.aws_codepipeline.Artifact("BuildArtifact");

    const buildApp = new cdk.aws_codebuild.Project(this, "BuildApp", {
      buildSpec: cdk.aws_codebuild.BuildSpec.fromAsset(
        path.join(__dirname, "buildspecs/build-app.yaml"),
      ),
      environment: {
        buildImage: cdk.aws_codebuild.LinuxBuildImage.STANDARD_7_0,
      },
    });

    // const lintApp = new cdk.aws_codebuild.Project(this, "BuildLint", {
    //   buildSpec: cdk.aws_codebuild.BuildSpec.fromAsset(
    //     path.join(__dirname, "buildspecs/lint.yaml"),
    //   ),
    //   environment: {
    //     buildImage: cdk.aws_codebuild.LinuxBuildImage.STANDARD_7_0,
    //   },
    // });

    // const unitTestApp = new cdk.aws_codebuild.Project(this, "BuildUnitTest", {
    //   buildSpec: cdk.aws_codebuild.BuildSpec.fromAsset(
    //     path.join(__dirname, "buildspecs/unit-test.yaml"),
    //   ),
    //   environment: {
    //     buildImage: cdk.aws_codebuild.LinuxBuildImage.STANDARD_7_0,
    //   },
    // });

    const deployApp = new cdk.aws_codebuild.Project(this, "Deploy", {
      buildSpec: cdk.aws_codebuild.BuildSpec.fromAsset(
        path.join(__dirname, "buildspecs/deploy.yaml"),
      ),
      environment: {
        buildImage: cdk.aws_codebuild.LinuxBuildImage.STANDARD_7_0,
        environmentVariables: {
          FUNCTION_NAME: { value: lambdaFunctionName },
          KEY: { value: "index.zip" },
        },
      },
    });

    const gitHubSourceAction =
      new cdk.aws_codepipeline_actions.GitHubSourceAction({
        actionName: "CheckOut",
        owner: "clayton650",
        oauthToken: cdk.SecretValue.secretsManager("github-access-token"),
        repo,
        branch,
        output: sourceArtifact,
        trigger: cdk.aws_codepipeline_actions.GitHubTrigger.WEBHOOK,
      });

    const sourceStage = {
      stageName: "Source",
      actions: [gitHubSourceAction],
    };

    const buildStage = {
      stageName: "Build",
      actions: [
        new cdk.aws_codepipeline_actions.CodeBuildAction({
          actionName: "BuildApp",
          input: sourceArtifact,
          project: buildApp,
          outputs: [buildArtifact],
        }),
      ],
    };

    // Turn off for now
    // const staticTestStage = {
    //   stageName: "StaticTests",
    //   actions: [
    //     new cdk.aws_codepipeline_actions.CodeBuildAction({
    //       actionName: "Lint",
    //       project: lintApp,
    //       input: sourceArtifact,
    //     }),
    //     new cdk.aws_codepipeline_actions.CodeBuildAction({
    //       actionName: "UnitTest",
    //       project: unitTestApp,
    //       input: sourceArtifact,
    //     }),
    //   ],
    // };

    deployApp.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: "AllowCodebuildToUpdateLambda",
        effect: cdk.aws_iam.Effect.ALLOW,
        actions: ["lambda:UpdateFunctionCode"],
        resources: [lambdaFunctionArn],
      }),
    );

    const lambdaUpdateAction = new cdk.aws_codepipeline_actions.CodeBuildAction(
      {
        actionName: "UpdateLambda",
        project: deployApp,
        input: buildArtifact,
      },
    );

    const deployStage = {
      stageName: "Deploy",
      actions: [lambdaUpdateAction],
    };

    new cdk.aws_codepipeline.Pipeline(this, "BuildDeployPipeline", {
      pipelineName: `${project}-${env.name}-pipeline`,
      restartExecutionOnUpdate: true,
      stages: [sourceStage, buildStage, deployStage],
    });
  }
}
