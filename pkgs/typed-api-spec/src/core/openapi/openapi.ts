import { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { AnyApiSpec, Method, OpenApiSpec } from "../spec";
import { JSONSchema7 } from "json-schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toPathItemObject = (
  endpoint: Partial<Record<Method, AnyApiSpec>>,
): OpenAPIV3.PathItemObject => {
  const ret: OpenAPIV3.PathItemObject = {};
  for (const method of Method) {
    const spec = endpoint[method];
    if (spec) {
      ret[method] = toOperationObject(spec);
    }
  }
  return ret;
};

const toOperationObject = (spec: OpenApiSpec): OpenAPIV3.OperationObject => {
  return {
    parameters: spec.params,
    responses: spec.responses,
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
