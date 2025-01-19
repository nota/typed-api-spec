import { OpenAPIV3_1 } from "openapi-types";
import {
  AnyApiSpec,
  JsonSchemaApiEndpoints,
  JsonSchemaApiResponses,
  JsonSchemaApiSpec,
  Method,
} from "../spec";
import { JSONSchema7 } from "json-schema";
import { StatusCode } from "../hono-types";

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

const toOperationObject = (
  spec: JsonSchemaApiSpec,
): OpenAPIV3_1.OperationObject => {
  const parameters = [];
  if (spec.params) {
    parameters.push(toParameterObject(spec.params, "test", "path"));
  }
  if (spec.query) {
    parameters.push(toParameterObject(spec.query, "test", "query"));
  }
  if (spec.headers) {
    parameters.push(toParameterObject(spec.headers, "test", "header"));
  }
  return {
    parameters,
    responses: toResponses(spec.responses),
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
        // FIXME: 安全にキャストすべき
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
        schema: body as OpenAPIV3_1.SchemaObject,
      },
    },
  };
};

const toResponses = (
  responses: JsonSchemaApiResponses,
): Record<string, OpenAPIV3_1.ResponseObject> => {
  const statusCodes = Object.keys(responses).map(Number) as StatusCode[];
  const ret: Record<string, OpenAPIV3_1.ResponseObject> = {};
  for (const statusCode of statusCodes) {
    const r = responses[statusCode];
    if (!r) {
      continue;
    }
    ret[statusCode] = toResponse(r.body);
  }
  return ret;
};

export const toOpenApiDoc = (
  doc: Omit<OpenAPIV3_1.Document, "paths">,
  endpoints: JsonSchemaApiEndpoints,
): OpenAPIV3_1.Document => {
  const paths: OpenAPIV3_1.PathsObject = {};
  for (const path of Object.keys(endpoints)) {
    paths[path] = toPathItemObject(endpoints[path]);
  }
  return { ...doc, paths };
};
