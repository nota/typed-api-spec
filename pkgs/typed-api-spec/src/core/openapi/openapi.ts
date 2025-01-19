import { OpenAPIV3_1 } from "openapi-types";
import {
  AnyOpenApiSpec,
  extractExtraApiSpecProps,
  JsonSchemaApiResponses,
  JsonSchemaOpenApiEndpoints,
  JsonSchemaOpenApiSpec,
  Method,
} from "../spec";
import { JSONSchema7 } from "json-schema";
import { StatusCode } from "../hono-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toPathItemObject = (
  endpoint: Partial<Record<Method, AnyOpenApiSpec>>,
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
  spec: JsonSchemaOpenApiSpec,
): OpenAPIV3_1.OperationObject => {
  const parameters = [];
  const extraProps = extractExtraApiSpecProps(spec);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (spec.params) {
    // FIXME name
    // FIXME パラメータはオブジェクトないのプロパティ一つずつで追加する
    parameters.push(toParameterObject(spec.params, "params-name", "path"));
  }
  if (spec.query) {
    // FIXME
    parameters.push(toParameterObject(spec.query, "query-name", "query"));
  }
  if (spec.headers) {
    // FIXME
    parameters.push(toParameterObject(spec.headers, "headers-name", "header"));
  }
  return {
    ...extraProps,
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
  endpoints: JsonSchemaOpenApiEndpoints,
): OpenAPIV3_1.Document => {
  const paths: OpenAPIV3_1.PathsObject = {};
  for (const path of Object.keys(endpoints)) {
    paths[path] = toPathItemObject(endpoints[path]);
  }
  return { ...doc, paths };
};
