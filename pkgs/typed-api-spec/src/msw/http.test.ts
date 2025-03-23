import { describe, it, expect, vi } from "vitest";
import { HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { newHttp } from "./index";
import { z } from "zod";
import { ApiEndpointsSchema } from "../core";

// Define a type-safe API schema using Zod
const endpoints = {
  "/users": {
    get: {
      responses: {
        200: { body: z.object({ id: z.string() }) },
      },
    },
  },
  "/users/:id": {
    get: {
      params: z.object({ id: z.string() }),
      responses: {
        200: { body: z.object({ id: z.string() }) },
        400: { body: z.object({ message: z.string() }) },
      },
    },
  },
} satisfies ApiEndpointsSchema;

const baseUrl = "https://example.com";
const httpT = newHttp(baseUrl, endpoints);
describe("Http type with MSW", () => {
  it("GET handler with Http type should be type-safe", () => {
    const handlers = [
      httpT.get(`${baseUrl}/users`, ({ response }) => {
        // @ts-expect-error textの型がおかしい
        response.text("ok");

        return response.json({
          id: "1",
        });
      }),

      httpT.get(`${baseUrl}/users/:id`, async (info) => {
        const result = await info.validate.params();
        if (result.issues) {
          return info.response.json(
            { message: "invalid user id" },
            { status: 400 },
          );
        }
        return info.response.json({ id: result.value.id });
      }),
    ];

    const server = setupServer(...handlers);
    expect(server).toBeDefined();
  });
});

describe("newHttp", () => {
  it("/users", async () => {
    // Create a spy resolver function to check the arguments
    const resolverSpy = vi.fn().mockImplementation(() => {
      return HttpResponse.json({ success: true });
    });

    // Create an instance of newHttp with our endpoints
    const http = newHttp(baseUrl, endpoints);

    // Setup a simple GET handler
    const handler = http.get(`${baseUrl}/users`, resolverSpy);

    // Create and setup server with the handler
    const server = setupServer(handler);
    server.listen();

    // Make a fetch request to trigger the handler
    await fetch("https://example.com/users");

    // Cleanup
    server.close();

    // Check if the resolver was called with the expected extraArg
    expect(resolverSpy).toHaveBeenCalledTimes(1);
    const arg = resolverSpy.mock.calls[0][0];
    expect(arg["request"]).toBeDefined();
    expect(arg["params"]).toBeDefined();
    expect(arg["validate"]).toBeDefined();
  });
});
