import {
  ValibotAnyApiResponses,
  ValibotApiEndpoint,
  ValibotApiSpec,
} from "./index";
import {
  Method,
  OpenApiEndpoint,
  OpenApiSpec,
  StatusCode,
  toParameterObject,
  toPathItemObject,
  toResponse,
} from "../core";
import { toJsonSchema } from "@valibot/to-json-schema";
import { OpenAPIV3 } from "openapi-types";

export const toOpenApiDoc = (
  doc: Omit<OpenAPIV3.Document, "paths">,
  endpoint: OpenApiEndpoint,
): OpenAPIV3.Document => {
  return {
    ...doc,
    paths: {
      "/pets": toPathItemObject(endpoint),
    },
  };
};

export const toOpenApiEndpoint = <E extends ValibotApiEndpoint>(
  endpoint: E,
): Partial<Record<Method, OpenApiSpec>> => {
  const ret: Partial<Record<Method, OpenApiSpec>> = {};
  for (const method of Method) {
    const spec = endpoint[method];
    if (spec) {
      ret[method] = toOpenApiSpec(spec);
    }
  }
  return ret;
};

export const toOpenApiSpec = <Spec extends ValibotApiSpec>(
  spec: Spec,
): OpenApiSpec => {
  const ret: OpenApiSpec = { responses: toResponses(spec.responses) };
  if (spec.params) {
    ret["params"] = spec.params
      ? [toParameterObject(toJsonSchema(spec.params), "test", "path")]
      : undefined;
  }
  if (spec.query) {
    ret["query"] = spec.query
      ? [toParameterObject(toJsonSchema(spec.query), "test", "query")]
      : undefined;
  }
  if (spec.headers) {
    ret["query"] = spec.headers
      ? [toParameterObject(toJsonSchema(spec.headers), "test", "header")]
      : undefined;
  }
  return ret;
};

const toResponses = (
  responses: ValibotAnyApiResponses,
): Record<string, OpenAPIV3.ResponseObject> => {
  const statusCodes = Object.keys(responses).map(Number) as StatusCode[];
  const ret: Record<string, OpenAPIV3.ResponseObject> = {};
  for (const statusCode of statusCodes) {
    const r = responses[statusCode];
    if (!r) {
      continue;
    }
    ret[statusCode] = toResponse(toJsonSchema(r.body));
  }
  return ret;
};