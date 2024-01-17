import { APIGatewayProxyHandler } from "aws-lambda";
import serverless from "serverless-http";
import { context } from "esbuild";
import app from "./app";

const handler = serverless(app);
export default handler;
