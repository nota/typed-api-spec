import { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { OpenApiSpec } from "../spec";
import { JSONSchema7 } from "json-schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toPathItemObject = (
  spec: OpenApiSpec,
): OpenAPIV3.PathItemObject => {
  return {
    get: {
      parameters: spec.params,
      responses: spec.responses,
    },
  };
};

export const toParameterObject = (
  schema: JSONSchema7,
  name: string,
  _in: "query" | "path" | "header",
): OpenAPIV3_1.ParameterObject => {
  return {
    name,
    in: _in,
    content: {
      "application/json": { schema: schema as OpenAPIV3.SchemaObject },
    },
  };
};

export const toResponse = (body: JSONSchema7): OpenAPIV3.ResponseObject => {
  return {
    description: "dummy-description",
    content: {
      "application/json": {
        // FIXME
        schema: body as OpenAPIV3.SchemaObject,
      },
    },
  };
};
