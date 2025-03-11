import { OpenAPIV3_1 } from "openapi-types";
import {
  JsonSchemaApiEndpoints,
  SSOpenApiEndpoints,
  toOpenApiDoc as toOpenApiDocOrg,
} from "../core";
import { JsonSchemaOpenApiEndpoints } from "../core/openapi/spec";
import { z } from "zod";
import { toJsonSchemaApiEndpoints as toEndpoints } from "../core/jsonschema";
import { createSchema } from "zod-openapi";
import { JSONSchema7 } from "json-schema";

export const toOpenApiDoc = <E extends SSOpenApiEndpoints>(
  doc: Omit<OpenAPIV3_1.Document, "paths">,
  endpoints: E,
): OpenAPIV3_1.Document => {
  const e = toJsonSchemaApiEndpoints(endpoints);
  return toOpenApiDocOrg(doc, e as JsonSchemaOpenApiEndpoints);
};

export const toJsonSchemaApiEndpoints = <E extends SSOpenApiEndpoints>(
  endpoints: E,
): JsonSchemaApiEndpoints => toEndpoints(toSchema, endpoints);

const toSchema = (s: z.ZodTypeAny) => {
  return createSchema(s).schema as JSONSchema7;
};
