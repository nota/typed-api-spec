import { OpenAPIV3_1 } from "openapi-types";
import {
  JsonSchemaApiEndpoints,
  SSOpenApiEndpoints,
  toOpenApiDoc as toOpenApiDocOrg,
} from "../core";
import { JsonSchemaOpenApiEndpoints } from "../core/openapi/spec";
import { toJsonSchemaApiEndpoints as toEndpoints } from "../core/jsonschema";
import { toJsonSchema } from "@valibot/to-json-schema";
import { SSApiEndpoints } from "../ss";

export const toOpenApiDoc = <E extends SSOpenApiEndpoints>(
  doc: Omit<OpenAPIV3_1.Document, "paths">,
  endpoints: E,
): OpenAPIV3_1.Document => {
  const e = toJsonSchemaApiEndpoints(endpoints);
  return toOpenApiDocOrg(doc, e as JsonSchemaOpenApiEndpoints);
};

export const toJsonSchemaApiEndpoints = <E extends SSApiEndpoints>(
  endpoints: E,
): JsonSchemaApiEndpoints => toEndpoints(toJsonSchema, endpoints);
