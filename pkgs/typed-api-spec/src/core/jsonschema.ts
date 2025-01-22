import {
  AnyApiEndpoint,
  AnyApiEndpoints,
  AnyApiResponses,
  AnyApiSpec,
  apiSpecRequestKeys,
  extractExtraApiSpecProps,
  extractExtraResponseProps,
  JsonSchemaApiEndpoints,
  JsonSchemaApiResponses,
  JsonSchemaApiSpec,
  Method,
} from "./spec";
import { StatusCode } from "./hono-types";
import { JSONSchema7 } from "json-schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToSchema = (schema: any) => JSONSchema7;

export const toJsonSchemaApiEndpoints = <E extends AnyApiEndpoints>(
  toSchema: ToSchema,
  endpoints: E,
): JsonSchemaApiEndpoints => {
  const ret: JsonSchemaApiEndpoints = {};
  for (const path of Object.keys(endpoints)) {
    ret[path] = toJsonSchemaEndpoint(toSchema, endpoints[path]);
  }
  return ret;
};

export const toJsonSchemaEndpoint = <Endpoint extends AnyApiEndpoint>(
  toSchema: ToSchema,
  endpoint: Endpoint,
) => {
  const ret: Partial<Record<Method, JsonSchemaApiSpec>> = {};
  for (const method of Method) {
    const spec = endpoint[method];
    if (spec) {
      ret[method] = toJsonSchemaApiSpec(toSchema, spec);
    }
  }
  return ret;
};

export const toJsonSchemaApiSpec = <Spec extends AnyApiSpec>(
  toSchema: ToSchema,
  spec: Spec,
): JsonSchemaApiSpec => {
  const extraProps = extractExtraApiSpecProps(spec);
  const ret: JsonSchemaApiSpec = {
    responses: toJsonSchemaResponses(toSchema, spec.responses),
  };
  for (const key of apiSpecRequestKeys) {
    if (spec[key]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ret[key] = toSchema(spec[key]);
    }
  }
  return { ...extraProps, ...ret };
};

const toJsonSchemaResponses = (
  toSchema: ToSchema,
  responses: AnyApiResponses,
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
      body: toSchema(r.body),
      headers: r.headers ? toSchema(r.headers) : undefined,
    };
  }
  return ret;
};
