import { describe, it, expect } from "vitest";
import { toOpenApiDoc, toOpenApiSpec } from "./openapi";
import { ValibotApiSpec } from "./index";
import * as v from "valibot";
import { OpenAPIV3 } from "openapi-types";
describe("openapi", () => {
  const spec: ValibotApiSpec = {
    body: undefined,
    headers: undefined,
    params: v.object({ page: v.string() }),
    query: undefined,
    responses: {
      200: { body: v.object({ message: v.string() }) },
    },
  };
  const expectSpec = {
    parameters: [
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
    ],
    responses: {
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
    },
  };
  it("toOpenApiSpec", () => {
    const oas = toOpenApiSpec(spec);
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
    const doc = toOpenApiDoc(baseDoc, spec);
    expect(doc).toEqual({
      ...baseDoc,
      paths: { "/pets": { get: expectSpec } },
    });
  });
});
