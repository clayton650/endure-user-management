import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import login from "./login";

export default function handler(
  _event: APIGatewayProxyEvent,
  _context: APIGatewayProxyResult,
) {
  try {
    login();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Hello from user management's login lambda!",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      isBase64Encoded: false,
    };
  } catch (error) {
    console.log("Login Lambda Error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Something went wrong! Error: ${error}`,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      isBase64Encoded: false,
    };
  }
}
