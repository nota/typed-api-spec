import { describe, it, expect } from "vitest";
import { toOpenApiDoc, toOpenApiEndpoint, toOpenApiSpec } from "./openapi";
import { ValibotApiEndpoints } from "./index";
import * as v from "valibot";
import { OpenAPIV3 } from "openapi-types";
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
  const expectSpec = {
    params: expectSpecParams,
    responses: expectSpecResponses,
  };
  const expectPathObject = {
    parameters: expectSpecParams,
    responses: expectSpecResponses,
  };
  it("toOpenApiSpec", () => {
    const oas = toOpenApiSpec(endpoints["/pets"].get);
    expect(oas).toEqual(expectSpec);
  });

  it("toOpenApiDoc", () => {
    const baseDoc: Omit<OpenAPIV3.Document, "paths"> = {
      openapi: "3.1.0",
      info: { title: "title", version: "1" },
      security: [],
      servers: [],
      components: {},
    };
    const openApiEndPoint = toOpenApiEndpoint(endpoints["/pets"]);
    const doc = toOpenApiDoc(baseDoc, openApiEndPoint);
    expect(doc).toEqual({
      ...baseDoc,
      paths: { "/pets": { get: expectPathObject } },
    });
  });
});
