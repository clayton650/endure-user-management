#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import UserManagementStack from "../lib/user-managment-stack";

const config = {
  accountId: "022703707499",
  envName: "prod",
  project: "user-management",
  domainName: "letsendure.com",
  subDomain: "user",
  region: "us-west-2",
};

const app = new cdk.App();

new UserManagementStack(app, "UserManagementStack", {
  domainName: config.domainName,
  subDomain: config.subDomain,
  env: {
    account: config.accountId,
    region: config.region,
  },
});

app.synth();
