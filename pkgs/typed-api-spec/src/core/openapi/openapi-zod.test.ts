import { describe, it, expect } from "vitest";
import { OpenAPIV3_1 } from "openapi-types";
import "zod-openapi/extend";
import z from "zod";
import { OpenApiEndpointsSchema, toOpenApiDoc } from "..";
describe("openapi", () => {
  const endpoints = {
    "/pets": {
      get: {
        description: "Get pet",
        query: z.object({ page: z.string() }),
        responses: {
          200: {
            description: "List of pets",
            body: z.array(z.object({ message: z.string() })),
          },
        },
      },
      post: {
        description: "Add pet",
        body: z.object({ name: z.string() }),
        responses: {
          200: {
            description: "Added pet",
            body: z.array(z.object({ message: z.string() })),
          },
        },
      },
    },
  } satisfies OpenApiEndpointsSchema;

  const expectGetPathObject = {
    description: "Get pet",
    parameters: [
      {
        content: { "application/json": { schema: { type: "string" } } },
        in: "query",
        name: "page",
      },
    ],
    responses: {
      "200": {
        content: {
          "application/json": {
            schema: {
              items: {
                properties: {
                  message: {
                    type: "string",
                  },
                },
                required: ["message"],
                type: "object",
              },
              type: "array",
            },
          },
        },
        description: "List of pets",
      },
    },
  };

  const expectPostPathObject = {
    description: "Add pet",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            properties: {
              name: {
                type: "string",
              },
            },
            required: ["name"],
            type: "object",
          },
        },
      },
    },
    parameters: [],
    responses: {
      "200": {
        content: {
          "application/json": {
            schema: {
              items: {
                properties: {
                  message: {
                    type: "string",
                  },
                },
                required: ["message"],
                type: "object",
              },
              type: "array",
            },
          },
        },
        description: "Added pet",
      },
    },
  };

  it("toOpenApiDoc", async () => {
    const baseDoc: Omit<OpenAPIV3_1.Document, "paths"> = {
      openapi: "3.1.0",
      info: { title: "title", version: "1" },
      security: [],
      servers: [],
      components: {},
    };
    const doc = await toOpenApiDoc(baseDoc, endpoints);
    expect(doc).toEqual({
      ...baseDoc,
      paths: {
        "/pets": { get: expectGetPathObject, post: expectPostPathObject },
      },
    });
  });
});
