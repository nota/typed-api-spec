import { ValibotAnyApiResponses, ValibotApiSpec } from "./index";
import {
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
  spec: ValibotApiSpec,
): OpenAPIV3.Document => {
  return {
    ...doc,
    paths: {
      "/pets": toPathItemObject(toOpenApiSpec(spec)),
    },
  };
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
