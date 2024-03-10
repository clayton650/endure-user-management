import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import handler from "./lambda";
import getUserDetails from "./get-user-details";

jest.mock("./get-user-details");

describe("handler", () => {
  const mockEvent = {
    body: JSON.stringify({
      accessToken: "mockAccessToken",
      userId: "mockUserId",
    }),
  } as APIGatewayProxyEvent;

  const mockUserDetails = { id: "mockUserId", name: "Mock User" };

  beforeEach(() => {
    (getUserDetails as jest.Mock).mockResolvedValue(mockUserDetails);
  });

  it("returns user details for valid request", async () => {
    const response = await handler(mockEvent, {} as APIGatewayProxyResult);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(JSON.stringify(mockUserDetails));
  });

  it("returns 400 for request with missing properties", async () => {
    const response = await handler(
      { ...mockEvent, body: "{}" },
      {} as APIGatewayProxyResult,
    );

    expect(response.statusCode).toEqual(400);
  });

  it("returns 500 for request when getUserDetails throws error", async () => {
    (getUserDetails as jest.Mock).mockRejectedValue(new Error("Test error"));

    const response = await handler(mockEvent, {} as APIGatewayProxyResult);

    expect(response.statusCode).toEqual(500);
  });
});
