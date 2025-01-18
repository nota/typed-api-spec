import { describe, it, expect } from "vitest";
import { ValibotApiEndpoints } from "./index";
import * as v from "valibot";
import { OpenAPIV3_1 } from "openapi-types";
import { toOpenApiDoc } from "../core";
import { toJsonSchemaApiEndpoints } from "./jsonschema";
// import { toOpenApiEndpoints } from "../core";
describe("openapi", () => {
  const endpoints = {
    "/pets": {
      get: {
        body: undefined,
        headers: undefined,
        params: v.object({ page: v.string() }),
        query: undefined,
        responses: {
          200: { body: v.object({ message: v.string() }) },
        },
      },
    },
  } satisfies ValibotApiEndpoints;
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
      in: "path",
      name: "test",
    },
  ];
  const expectSpecResponses = {
    "200": {
      content: {
        "application/json": {
          schema: {
            $schema: "http://json-schema.org/draft-07/schema#",
            properties: {
              message: {
                type: "string",
              },
            },
            required: ["message"],
            type: "object",
          },
        },
      },
      description: "dummy-description",
    },
  };
  const expectPathObject = {
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
    const jsonSchemaApiEndPoints = toJsonSchemaApiEndpoints(endpoints);
    const doc = toOpenApiDoc(baseDoc, jsonSchemaApiEndPoints);
    expect(doc).toEqual({
      ...baseDoc,
      paths: { "/pets": { get: expectPathObject } },
    });
  });
});
