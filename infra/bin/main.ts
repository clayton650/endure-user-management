#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { UserManagementStack, UserManagementPipeline } from "../lib";
import getConfig from "../config";

const app = new cdk.App();

const env = app.node.tryGetContext("env");

const config = getConfig(env);

const { lambdaFunctionName, lambdaFunctionArn } = new UserManagementStack(
  app,
  "UserManagementStack",
  {
    domainName: config.domainName,
    subDomain: config.subDomain,
    project: config.project,
    env: {
      name: config.envName,
      account: config.accountId,
      region: config.region,
    },
  },
);

// TODO: Deploy to devops account
new UserManagementPipeline(app, "UserManagementPipelineStack", {
  repo: config.repo,
  branch: config.branch,
  project: config.project,
  lambdaFunctionName,
  lambdaFunctionArn,
  env: {
    name: config.envName,
    account: config.accountId,
    region: config.region,
  },
});

app.synth();
