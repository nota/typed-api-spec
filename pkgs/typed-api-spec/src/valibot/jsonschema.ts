import {
  ValibotAnyApiResponses,
  ValibotApiEndpoint,
  ValibotApiEndpoints,
  ValibotApiSpec,
} from "./index";
import {
  JsonSchemaApiEndpoints,
  JsonSchemaApiResponses,
  JsonSchemaApiSpec,
  Method,
  StatusCode,
} from "../core";
import { toJsonSchema } from "@valibot/to-json-schema";
import { JSONSchema4 } from "json-schema";
import { BaseIssue, BaseSchema } from "valibot";

export const toJsonSchemaApiEndpoints = <E extends ValibotApiEndpoints>(
  endpoints: E,
): JsonSchemaApiEndpoints => {
  const ret: JsonSchemaApiEndpoints = {};
  for (const path of Object.keys(endpoints)) {
    ret[path] = toJsonSchemaEndpoint(endpoints[path]);
  }
  return ret;
};

export const toJsonSchemaEndpoint = <Endpoint extends ValibotApiEndpoint>(
  endpoint: Endpoint,
) => {
  const ret: Partial<Record<Method, JsonSchemaApiSpec>> = {};
  for (const method of Method) {
    const spec = endpoint[method];
    if (spec) {
      ret[method] = toJsonSchemaApiSpec(spec);
    }
  }
  return ret;
};

export const toJsonSchemaApiSpec = <Spec extends ValibotApiSpec>(
  spec: Spec,
): JsonSchemaApiSpec => {
  const ret: JsonSchemaApiSpec = {
    responses: toJsonSchemaResponses(spec.responses),
  };
  if (spec.params) {
    ret["params"] = toJsonSchema4(spec.params);
  }
  if (spec.query) {
    ret["query"] = toJsonSchema4(spec.query);
  }
  if (spec.headers) {
    ret["headers"] = toJsonSchema4(spec.headers);
  }
  return ret;
};

const toJsonSchemaResponses = (
  responses: ValibotAnyApiResponses,
): JsonSchemaApiResponses => {
  const statusCodes = Object.keys(responses).map(Number) as StatusCode[];
  const ret: JsonSchemaApiResponses = {};
  for (const statusCode of statusCodes) {
    const r = responses[statusCode];
    if (!r) {
      continue;
    }
    // FIXME cast 7 to 4
    ret[statusCode] = {
      body: toJsonSchema4(r.body),
      headers: r.headers ? toJsonSchema4(r.headers) : undefined,
    };
  }
  return ret;
};

// FIXME: 7から4へ安全にキャストすべき
const toJsonSchema4 = (
  schema: BaseSchema<unknown, unknown, BaseIssue<unknown>>,
): JSONSchema4 => toJsonSchema(schema) as JSONSchema4;
