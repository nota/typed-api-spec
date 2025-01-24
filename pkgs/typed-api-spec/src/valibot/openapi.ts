import { OpenAPIV3_1 } from "openapi-types";
import {
  JsonSchemaApiEndpoints,
  toOpenApiDoc as toOpenApiDocOrg,
} from "../core";
import { AnyV } from "./util";
import {
  BaseOpenApiSpec,
  DefineOpenApiEndpoint,
  DefineOpenApiResponses,
  JsonSchemaOpenApiEndpoints,
  ToOpenApiResponse,
} from "../core/openapi/spec";
import { ValibotAnyApiResponse, ValibotApiEndpoints } from "./spec";
import { toJsonSchemaApiEndpoints as toEndpoints } from "../core/jsonschema";
import { toJsonSchema } from "@valibot/to-json-schema";

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
export type ValibotOpenApiEndpoint = DefineOpenApiEndpoint<ValibotOpenApiSpec>;
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
> = BaseOpenApiSpec<Params, Query, Body, RequestHeaders, Responses>;

export const toJsonSchemaApiEndpoints = <E extends ValibotApiEndpoints>(
  endpoints: E,
): JsonSchemaApiEndpoints => toEndpoints(toJsonSchema, endpoints);
