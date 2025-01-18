import { OpenAPIV3_1 } from "openapi-types";
import { AnyApiSpec, Method, OpenApiSpec } from "../spec";
import { JSONSchema7 } from "json-schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toPathItemObject = (
  endpoint: Partial<Record<Method, AnyApiSpec>>,
): OpenAPIV3_1.PathItemObject => {
  const ret: OpenAPIV3_1.PathItemObject = {};
  for (const method of Method) {
    const spec = endpoint[method];
    if (spec) {
      // FIXME
      // @ts-expect-error なぜか型エラーになるのでよくわからんが潰す
      ret[method] = toOperationObject(spec) as OpenAPIV3_1.OperationObject;
    }
  }
  return ret;
};

const toOperationObject = (spec: OpenApiSpec): OpenAPIV3_1.OperationObject => {
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
      "application/json": {
        schema: schema as OpenAPIV3_1.ParameterObject["schema"],
      },
    },
  };
};

export const toResponse = (body: JSONSchema7): OpenAPIV3_1.ResponseObject => {
  return {
    description: "dummy-description",
    content: {
      "application/json": {
        // FIXME: JSONSchema7から4へ安全にキャスト
        schema: body as OpenAPIV3_1.SchemaObject,
      },
    },
  };
};
