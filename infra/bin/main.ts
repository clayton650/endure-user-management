#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { UserManagementStack, UserManagementPipeline } from "../lib";

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

new UserManagementStack(app, "UserManagementStack", {
  domainName: config.domainName,
  subDomain: config.subDomain,
  project: config.project,
  env: {
    name: config.envName,
    account: config.accountId,
    region: config.region,
  },
});

new UserManagementPipeline(app, "UseManagementPipelineStack", {
  repo: config.repo,
  branch: config.branch,
  project: config.project,
  env: {
    name: config.envName,
    account: config.accountId,
    region: config.region,
  },
});

app.synth();
