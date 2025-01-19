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
        body: undefined,
        headers: undefined,
        query: v.object({ page: v.string() }),
        responses: {
          200: {
            description: "List of pets",
            body: v.array(v.object({ message: v.string() })),
          },
        },
      },
    },
  } satisfies ValibotOpenApiEndpoints;
  const expectSpecParams = [
    {
      content: {
        "application/json": {
          schema: {
            $schema: "http://json-schema.org/draft-07/schema#",
            properties: {
              page: {
                type: "string",
              },
            },
            required: ["page"],
            type: "object",
          },
        },
      },
      in: "query",
      name: "query-name",
    },
  ];
  const expectSpecResponses = {
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
  };
  const expectPathObject = {
    description: "Get pet",
    parameters: expectSpecParams,
    responses: expectSpecResponses,
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
      paths: { "/pets": { get: expectPathObject } },
    });
  });
});
