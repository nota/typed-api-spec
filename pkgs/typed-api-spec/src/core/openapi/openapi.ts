import { OpenAPIV3_1 } from "openapi-types";
import {
  extractExtraApiSpecProps,
  extractExtraResponseProps,
  JsonSchemaApiResponses,
  Method,
} from "../spec";
import { JSONSchema7 } from "json-schema";
import { StatusCode } from "../hono-types";
import {
  AnyOpenApiSpec,
  BaseOpenApiSpec,
  DefineOpenApiEndpoint,
  DefineOpenApiResponses,
  JsonSchemaOpenApiEndpoints,
  JsonSchemaOpenApiSpec,
  ToOpenApiResponse,
} from "./spec";
import { StandardSchemaV1 } from "@standard-schema/spec";
import { SSAnyApiResponse } from "../../ss";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStandardSchemaV1 = StandardSchemaV1<any>;
export type SSOpenApiEndpoints = {
  [Path in string]: SSOpenApiEndpoint;
};
export type SSOpenApiEndpoint = DefineOpenApiEndpoint<SSOpenApiSpec>;
export type SSAnyOpenApiResponse = ToOpenApiResponse<SSAnyApiResponse>;
export type SSAnyOpenApiResponses =
  DefineOpenApiResponses<SSAnyOpenApiResponse>;

export type SSOpenApiSpec<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string = string,
  Params extends AnyStandardSchemaV1 = AnyStandardSchemaV1,
  Query extends AnyStandardSchemaV1 = AnyStandardSchemaV1,
  Body extends AnyStandardSchemaV1 = AnyStandardSchemaV1,
  RequestHeaders extends AnyStandardSchemaV1 = AnyStandardSchemaV1,
  Responses extends SSAnyOpenApiResponses = SSAnyOpenApiResponses,
> = BaseOpenApiSpec<Params, Query, Body, RequestHeaders, Responses>;

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
  if (spec.params) {
    parameters.push(...schemaToParameterObject(spec.params, "path"));
  }
  if (spec.query) {
    parameters.push(...schemaToParameterObject(spec.query, "query"));
  }
  if (spec.headers) {
    parameters.push(...schemaToParameterObject(spec.headers, "header"));
  }
  const reqBody = spec.body
    ? {
        requestBody: {
          content: {
            // FIXME json決め打ちをやめる
            "application/json": {
              schema: spec.body as OpenAPIV3_1.SchemaObject,
            },
          },
        },
      }
    : {};
  return {
    ...extraProps,
    parameters,
    responses: toResponses(spec.responses),
    ...reqBody,
  };
};

const schemaToParameterObject = (
  schema: JSONSchema7,
  _in: "query" | "path" | "header",
): OpenAPIV3_1.ParameterObject[] => {
  if (schema.type !== "object") {
    throw new Error("params should be object");
  }
  return Object.entries(schema.properties ?? {}).flatMap(([name, def]) => {
    if (typeof def === "boolean" || !def.type || Array.isArray(def.type)) {
      return [];
    }
    return [toParameterObject(def, name, _in)];
  });
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
      // FIXME: json決め打ちをやめる
      "application/json": {
        // FIXME: 安全にキャストすべき
        schema: schema as OpenAPIV3_1.ParameterObject["schema"],
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
    const extraProps = extractExtraResponseProps(r);
    // FIXME: ランタイムのチェックを入れたりしてもうちょっと安全にキャストできるような気もする
    ret[statusCode] = {
      ...extraProps,
      content: {
        // FIXME json決め打ちをやめる
        "application/json": {
          schema: r.body as OpenAPIV3_1.SchemaObject,
        },
      },
    } as unknown as OpenAPIV3_1.ResponseObject;
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
