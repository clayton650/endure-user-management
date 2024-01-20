import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import login from "./login";

// TODO: CORS
// TODO: Docs
export default async function handler(
  _event: APIGatewayProxyEvent,
  _context: APIGatewayProxyResult,
) {
  try {
    await login();

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: "Hello from user management's login lambda!",
      }),
    };
  } catch (error) {
    console.log("Login Lambda Error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Something went wrong! Error: ${error}`,
      }),
    };
  }
}
