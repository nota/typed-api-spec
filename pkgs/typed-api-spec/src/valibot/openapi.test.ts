import { describe, it, expect } from "vitest";
import { ValibotOpenApiEndpoints } from ".";
import * as v from "valibot";
import { OpenAPIV3_1 } from "openapi-types";
import { toOpenApiDoc } from "./openapi";

describe("openapi", () => {
  const endpoints = {
    "/pets": {
      get: {
        description: "Get pet",
        query: v.object({ page: v.string() }),
        responses: {
          200: {
            description: "List of pets",
            body: v.array(v.object({ message: v.string() })),
          },
        },
      },
      post: {
        description: "Add pet",
        body: v.object({ name: v.string() }),
        responses: {
          200: {
            description: "Added pet",
            body: v.array(v.object({ message: v.string() })),
          },
        },
      },
    },
  } satisfies ValibotOpenApiEndpoints;

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
              $schema: "http://json-schema.org/draft-07/schema#",
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
            $schema: "http://json-schema.org/draft-07/schema#",
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
              $schema: "http://json-schema.org/draft-07/schema#",
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

  it("toOpenApiDoc", () => {
    const baseDoc: Omit<OpenAPIV3_1.Document, "paths"> = {
      openapi: "3.1.0",
      info: { title: "title", version: "1" },
      security: [],
      servers: [],
      components: {},
    };
    const doc = toOpenApiDoc(baseDoc, endpoints);
    expect(doc).toEqual({
      ...baseDoc,
      paths: {
        "/pets": { get: expectGetPathObject, post: expectPostPathObject },
      },
    });
  });
});
