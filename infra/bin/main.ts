#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import {
  UserManagementBucketStack,
  UserManagementStack,
  UserManagementPipeline,
} from "../lib";

const config = {
  accountId: "022703707499",
  project: "user-management",
  envName: "prod",
  region: "us-west-2",
  domainName: "letsendure.com",
  subDomain: "user",
  repo: "endure-user-management",
  branch: "main",
  userAuthUrl: "https://auth.letsendure.com",
};

const app = new cdk.App();

// TODO: remove this stack
const { artifactBucket, buildArtifactKey } = new UserManagementBucketStack(
  app,
  "UserManagementBucketStack",
  {
    project: config.project,
    env: {
      name: config.envName,
    },
  },
);

const { lambdaFunctionName, lambdaFunctionArn } = new UserManagementStack(
  app,
  "UserManagementStack",
  {
    domainName: config.domainName,
    subDomain: config.subDomain,
    project: config.project,
    artifactBucket,
    apiBuildBucketKey: buildArtifactKey,
    userAuthUrl: config.userAuthUrl,
    env: {
      name: config.envName,
      account: config.accountId,
      region: config.region,
    },
  },
);

new UserManagementPipeline(app, "UseManagementPipelineStack", {
  repo: config.repo,
  branch: config.branch,
  project: config.project,
  lambdaFunctionName,
  lambdaFunctionArn,
  artifactBucket,
  apiBuildBucketKey: buildArtifactKey,
  env: {
    name: config.envName,
    account: config.accountId,
    region: config.region,
  },
});

app.synth();
