import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import auth from "./auth";
import MissingRequiredPropertiesError from "../common/MissingRequiredPropertiesError";

interface AuthHandlerEventBody {
  accessToken: string;
  userId: string;
}

// TODO: CORS
// TODO: Docs
export default async function handler(
  event: APIGatewayProxyEvent,
  _context: APIGatewayProxyResult,
) {
  try {
    console.log("APIGatewayProxyEvent:", event);
    const { body } = event;
    const { accessToken, userId } = JSON.parse(
      body || "{}",
    ) as AuthHandlerEventBody;

    if (!accessToken || !userId) {
      throw new MissingRequiredPropertiesError(
        "Missing required property(ies)",
      );
    }

    const userAuthInfo = await auth(accessToken, userId);

    // TODO: deal with security implications related to headers and CORS
    return {
      statusCode: 200,
      body: JSON.stringify(userAuthInfo),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (err) {
    const error = err as Error;
    console.log("Auth Lambda Error:", error);

    if (error instanceof MissingRequiredPropertiesError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Invalid request: Missing required property(ies) in the payload",
        }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Something went wrong! Error: ${error}`,
      }),
    };
  }
}
