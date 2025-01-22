import {
  apiSpecRequestKeys,
  extractExtraApiSpecProps,
  extractExtraResponseProps,
  JsonSchemaApiEndpoints,
  JsonSchemaApiResponses,
  JsonSchemaApiSpec,
  Method,
  StatusCode,
} from "../core";
import {
  ZodAnyApiResponses,
  ZodApiEndpoint,
  ZodApiEndpoints,
  ZodApiSpec,
} from "./index";
import { createSchema } from "zod-openapi";
import { JSONSchema7 } from "json-schema";
import { z } from "zod";

export const toJsonSchemaApiEndpoints = <E extends ZodApiEndpoints>(
  endpoints: E,
): JsonSchemaApiEndpoints => {
  const ret: JsonSchemaApiEndpoints = {};
  for (const path of Object.keys(endpoints)) {
    ret[path] = toJsonSchemaEndpoint(endpoints[path]);
  }
  return ret;
};

export const toJsonSchemaEndpoint = <Endpoint extends ZodApiEndpoint>(
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

export const toJsonSchemaApiSpec = <Spec extends ZodApiSpec>(
  spec: Spec,
): JsonSchemaApiSpec => {
  const extraProps = extractExtraApiSpecProps(spec);
  const ret: JsonSchemaApiSpec = {
    responses: toJsonSchemaResponses(spec.responses),
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
  responses: ZodAnyApiResponses,
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

const toSchema = (s: z.ZodTypeAny) => {
  return createSchema(s).schema as JSONSchema7;
};
