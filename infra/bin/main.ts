#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import UserManagementStack from "../lib";

const config = {
  accountId: "022703707499",
  envName: "prod",
  region: "us-west-2",
  project: "user-management",
  domainName: "letsendure.com",
  subDomain: "user",
};

const app = new cdk.App();

new UserManagementStack(app, "UserManagementStack", {
  domainName: config.domainName,
  subDomain: config.subDomain,
  env: {
    name: config.envName,
    account: config.accountId,
    region: config.region,
  },
});

app.synth();
