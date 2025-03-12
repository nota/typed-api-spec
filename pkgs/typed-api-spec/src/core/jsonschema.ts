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
import { StandardSchemaV1 } from "@standard-schema/spec";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToSchema = (schema: StandardSchemaV1<any>) => Promise<JSONSchema7>;

export const toJsonSchemaApiEndpoints = async <E extends AnyApiEndpoints>(
  toSchema: ToSchema,
  endpoints: E,
): Promise<JsonSchemaApiEndpoints> => {
  const ret: JsonSchemaApiEndpoints = {};
  for (const path of Object.keys(endpoints)) {
    ret[path] = await toJsonSchemaEndpoint(toSchema, endpoints[path]);
  }
  return ret;
};

export const toJsonSchemaEndpoint = async <Endpoint extends AnyApiEndpoint>(
  toSchema: ToSchema,
  endpoint: Endpoint,
): Promise<Partial<Record<Method, JsonSchemaApiSpec>>> => {
  const ret: Partial<Record<Method, JsonSchemaApiSpec>> = {};
  for (const method of Method) {
    const spec = endpoint[method];
    if (spec) {
      ret[method] = await toJsonSchemaApiSpec(toSchema, spec);
    }
  }
  return ret;
};

export const toJsonSchemaApiSpec = async <Spec extends AnyApiSpec>(
  toSchema: ToSchema,
  spec: Spec,
): Promise<JsonSchemaApiSpec> => {
  const extraProps = extractExtraApiSpecProps(spec);
  const ret: JsonSchemaApiSpec = {
    responses: await toJsonSchemaResponses(toSchema, spec.responses),
  };
  for (const key of apiSpecRequestKeys) {
    if (spec[key]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ret[key] = await toSchema(spec[key]);
    }
  }
  return { ...extraProps, ...ret };
};

const toJsonSchemaResponses = async (
  toSchema: ToSchema,
  responses: AnyApiResponses,
): Promise<JsonSchemaApiResponses> => {
  const statusCodes = Object.keys(responses).map(Number) as StatusCode[];
  const ret: JsonSchemaApiResponses = {};
  for (const statusCode of statusCodes) {
    const r = responses[statusCode];
    if (!r) {
      continue;
    }
    ret[statusCode] = {
      ...extractExtraResponseProps(r),
      body: await toSchema(r.body),
      headers: r.headers ? await toSchema(r.headers) : undefined,
    };
  }
  return ret;
};
