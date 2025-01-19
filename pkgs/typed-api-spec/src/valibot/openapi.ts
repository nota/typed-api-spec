import { OpenAPIV3_1 } from "openapi-types";
import { toJsonSchemaApiEndpoints } from "./jsonschema";
import { Method, toOpenApiDoc as toOpenApiDocOrg } from "../core";
import { AnyV } from "./util";
import {
  BaseOpenApiSpec,
  DefineOpenApiResponses,
  JsonSchemaOpenApiEndpoints,
  PathItemObject,
  ToOpenApiResponse,
} from "../core/openapi/spec";
import { ValibotAnyApiResponse } from "./spec";

export const toOpenApiDoc = <E extends ValibotOpenApiEndpoints>(
  doc: Omit<OpenAPIV3_1.Document, "paths">,
  endpoints: E,
): OpenAPIV3_1.Document => {
  const e = toJsonSchemaApiEndpoints(endpoints);
  return toOpenApiDocOrg(doc, e as JsonSchemaOpenApiEndpoints);
};

export type ValibotOpenApiEndpoints = {
  [Path in string]: ValibotOpenApiEndpoint;
};
export type ValibotOpenApiEndpoint = Partial<
  Record<Method, ValibotOpenApiSpec>
>;
export type ValibotAnyOpenApiResponse =
  ToOpenApiResponse<ValibotAnyApiResponse>;
export type ValibotAnyOpenApiResponses =
  DefineOpenApiResponses<ValibotAnyOpenApiResponse>;

export type ValibotOpenApiSpec<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string = string,
  Params extends AnyV = AnyV,
  Query extends AnyV = AnyV,
  Body extends AnyV = AnyV,
  RequestHeaders extends AnyV = AnyV,
  Responses extends ValibotAnyOpenApiResponses = ValibotAnyOpenApiResponses,
> = BaseOpenApiSpec<Params, Query, Body, RequestHeaders, Responses> &
  PathItemObject;
