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
    };
  } catch (error) {
    console.log(error);

    return {
      statusCode: 500,
    };
  }
}
