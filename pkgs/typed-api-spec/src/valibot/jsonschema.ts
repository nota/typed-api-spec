import {
  ValibotAnyApiResponses,
  ValibotApiEndpoint,
  ValibotApiEndpoints,
  ValibotApiSpec,
} from "./index";
import {
  extractExtraApiSpecProps,
  extractExtraResponseProps,
  JsonSchemaApiEndpoints,
  JsonSchemaApiResponses,
  JsonSchemaApiSpec,
  Method,
  StatusCode,
} from "../core";
import { toJsonSchema } from "@valibot/to-json-schema";

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
  const extraProps = extractExtraApiSpecProps(spec);
  const ret: JsonSchemaApiSpec = {
    responses: toJsonSchemaResponses(spec.responses),
  };
  if (spec.params) {
    ret["params"] = toJsonSchema(spec.params);
  }
  if (spec.query) {
    ret["query"] = toJsonSchema(spec.query);
  }
  if (spec.headers) {
    ret["headers"] = toJsonSchema(spec.headers);
  }
  return { ...extraProps, ...ret };
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
    ret[statusCode] = {
      ...extractExtraResponseProps(r),
      body: toJsonSchema(r.body),
      headers: r.headers ? toJsonSchema(r.headers) : undefined,
    };
  }
  return ret;
};
