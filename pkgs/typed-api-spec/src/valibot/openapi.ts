import { OpenAPIV3_1 } from "openapi-types";
import { toJsonSchemaApiEndpoints } from "./jsonschema";
import { toOpenApiDoc as toOpenApiDocOrg } from "../core";
import { ValibotApiEndpoints } from "./index";

export const toOpenApiDoc = <E extends ValibotApiEndpoints>(
  doc: Omit<OpenAPIV3_1.Document, "paths">,
  endpoints: E,
): OpenAPIV3_1.Document => {
  const e = toJsonSchemaApiEndpoints(endpoints);
  return toOpenApiDocOrg(doc, e);
};

// export const ValibotOpenApiSpec = ValibotA;
