import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Http } from "../index";
import { DefineApiEndpoints } from "../../../dist";

// Define a type-safe API schema
type UserApiEndpoints = DefineApiEndpoints<{
  "/users": {
    get: {
      responses: {
        200: { body: { id: string } };
      };
    };
  };
  "/users/:id": {
    get: {
      params: {
        id: string;
      };
      responses: {
        200: { body: { id: string } };
      };
    };
  };
}>;

const httpT = http as Http<UserApiEndpoints>;

describe("Http type with MSW", () => {
  it("GET handler with Http type should be type-safe", () => {
    const handlers = [
      httpT.get("/users", () => {
        return HttpResponse.json<{ id: string }>({
          id: "1",
        });
      }),

      httpT.get("/users/:id", ({ params }) => {
        const { id } = params;
        return HttpResponse.json<{ id: string }>({ id });
      }),
    ];

    const server = setupServer(...handlers);
    expect(server).toBeDefined();
  });
});
