#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import {
  UserManagementBucketStack,
  UserManagementStack,
  UserManagementPipeline,
} from "../lib";
import UserPoolStack from "../lib/user-pool-stack";

const config = {
  accountId: "022703707499",
  project: "user-management",
  envName: "prod",
  region: "us-west-2",
  domainName: "letsendure.com",
  subDomain: "user",
  repo: "endure-user-management",
  branch: "main",
};

const app = new cdk.App();

// TODO: remove this stack, requires reworking below stacks
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

new UserPoolStack(app, "UserPoolStack", {
  env: {
    name: config.envName,
    account: config.accountId,
    region: config.region,
  },
});

const { lambdaFunctionName, lambdaFunctionArn } = new UserManagementStack(
  app,
  "UserManagementStack",
  {
    domainName: config.domainName,
    subDomain: config.subDomain,
    project: config.project,
    artifactBucket,
    apiBuildBucketKey: buildArtifactKey,
    env: {
      name: config.envName,
      account: config.accountId,
      region: config.region,
    },
  },
);

// TODO: fix typo in id
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
