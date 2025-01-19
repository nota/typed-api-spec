import { OpenAPIV3_1 } from "openapi-types";
import { toJsonSchemaApiEndpoints } from "./jsonschema";
import { Method, toOpenApiDoc as toOpenApiDocOrg } from "../core";
import { ValibotApiSpec } from "./spec";

export const toOpenApiDoc = <E extends ValibotOpenApiEndpoints>(
  doc: Omit<OpenAPIV3_1.Document, "paths">,
  endpoints: E,
): OpenAPIV3_1.Document => {
  const e = toJsonSchemaApiEndpoints(endpoints);
  return toOpenApiDocOrg(doc, e);
};

export type ValibotOpenApiEndpoints = {
  [Path in string]: ValibotOpenApiEndpoint;
};
export type ValibotOpenApiEndpoint = Partial<
  Record<Method, ValibotOpenApiSpec>
>;
export type ValibotOpenApiSpec = ValibotApiSpec &
  Omit<OpenAPIV3_1.PathItemObject, "parameters" | "responses" | "requestBody">;
