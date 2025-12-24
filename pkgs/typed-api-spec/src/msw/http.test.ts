import { describe, it, expect, vi, assert } from "vitest";
import { HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { newHttp } from "./index";
import { z } from "zod/v4";
import { ApiEndpointsSchema } from "../core";
import { newFetch } from "../fetch";
import JSONT from "../json";

const JSONT = JSON as JSONT;

// Define a type-safe API schema using Zod
const endpoints = {
  "/users": {
    get: {
      responses: {
        200: { body: z.object({ id: z.string() }) },
      },
    },
    post: {
      body: z.object({ name: z.string() }),
      responses: {
        201: { body: z.object({ id: z.string() }) },
        400: { body: z.object({ message: z.string() }) },
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

const http = newHttp(baseUrl, endpoints);
describe("http handlers", () => {
  it("GET", async () => {
    const handlers = [
      http.get(`${baseUrl}/users`, ({ response }) => {
        // @ts-expect-error textの型がおかしい
        response.text("ok");

        return response.json({
          id: "1",
        });
      }),

      http.get(`${baseUrl}/users/:id`, async (info) => {
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
    server.listen();
    const fetchT = await newFetch(async () => endpoints, true)<
      typeof baseUrl
    >();
    const res = await fetchT("https://example.com/users", {});
    server.close();

    if (!res.ok) {
      const json = await res.text();
      assert.fail("invalid response: " + JSON.stringify(json));
    }
    const json = await res.json();
    expect(json).toEqual({ id: "1" });
  });

  it("POST", async () => {
    const handlers = [
      http.post(`${baseUrl}/users`, async (info) => {
        const result = await info.validate.body();
        if (result.issues) {
          return info.response.json(
            { message: "invalid name" },
            { status: 400 },
          );
        }
        return info.response.json({ id: "1" }, { status: 201 });
      }),
    ];

    const server = setupServer(...handlers);
    expect(server).toBeDefined();
    server.listen();
    try {
      const fetchT = await newFetch(async () => endpoints, true)<
        typeof baseUrl
      >();
      await fetchT("https://example.com/users", {
        method: "POST",
        body: JSONT.stringify({ name: "test" }),
      });
    } finally {
      server.close();
    }
  });

  it("spy handler", async () => {
    // Create a spy resolver function to check the arguments
    const resolverSpy = vi.fn().mockImplementation(() => {
      // Return response that matches the schema defined for the endpoint
      return HttpResponse.json({ id: "test-id" });
    });

    // Create an instance of newHttp with our endpoints
    const http = newHttp(baseUrl, endpoints);

    // Setup a simple GET handler
    const handler = http.get(`${baseUrl}/users`, resolverSpy);

    // Create and setup server with the handler
    const server = setupServer(handler);

    // Start server before making request
    server.listen({ onUnhandledRequest: "error" });

    try {
      const fetchT = await newFetch(async () => endpoints, true)<
        typeof baseUrl
      >();

      // Make a fetch request to trigger the handler
      const res = await fetchT("https://example.com/users", {});

      // Check if the resolver was called with the expected extraArg
      expect(resolverSpy).toHaveBeenCalledTimes(1);
      const arg = resolverSpy.mock.calls[0][0];
      expect(arg["request"]).toBeDefined();
      expect(arg["params"]).toBeDefined();
      expect(arg["validate"]).toBeDefined();
      expect(arg["response"]).toBeDefined();

      if (!res.ok) {
        const errorText = await res.text();
        assert.fail(`Invalid response: ${errorText}`);
      }

      const json = await res.json();
      expect(json).toEqual({ id: "test-id" });
    } finally {
      // Always close the server, even if the test fails
      server.close();
      server.resetHandlers();
    }
  });
});
