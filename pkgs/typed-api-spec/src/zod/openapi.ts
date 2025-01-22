import { OpenAPIV3_1 } from "openapi-types";
import {
  JsonSchemaApiEndpoints,
  toOpenApiDoc as toOpenApiDocOrg,
} from "../core";
import {
  BaseOpenApiSpec,
  DefineOpenApiEndpoint,
  DefineOpenApiResponses,
  JsonSchemaOpenApiEndpoints,
  ToOpenApiResponse,
} from "../core/openapi/spec";
import { z } from "zod";
import { ZodAnyApiResponse, ZodApiEndpoints } from "./index";
import { toJsonSchemaApiEndpoints as toEndpoints } from "../core/jsonschema";
import { createSchema } from "zod-openapi";
import { JSONSchema7 } from "json-schema";

export const toOpenApiDoc = <E extends ZodOpenApiEndpoints>(
  doc: Omit<OpenAPIV3_1.Document, "paths">,
  endpoints: E,
): OpenAPIV3_1.Document => {
  const e = toJsonSchemaApiEndpoints(endpoints);
  return toOpenApiDocOrg(doc, e as JsonSchemaOpenApiEndpoints);
};

export type ZodOpenApiEndpoints = {
  [Path in string]: ZodOpenApiEndpoint;
};
export type ZodOpenApiEndpoint = DefineOpenApiEndpoint<ZodOpenApiSpec>;
export type ZodAnyOpenApiResponse = ToOpenApiResponse<ZodAnyApiResponse>;
export type ZodAnyOpenApiResponses =
  DefineOpenApiResponses<ZodAnyOpenApiResponse>;

export type ZodOpenApiSpec<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string = string,
  Params extends z.ZodTypeAny = z.ZodTypeAny,
  Query extends z.ZodTypeAny = z.ZodTypeAny,
  Body extends z.ZodTypeAny = z.ZodTypeAny,
  RequestHeaders extends z.ZodTypeAny = z.ZodTypeAny,
  Responses extends ZodAnyOpenApiResponses = ZodAnyOpenApiResponses,
> = BaseOpenApiSpec<Params, Query, Body, RequestHeaders, Responses>;

export const toJsonSchemaApiEndpoints = <E extends ZodApiEndpoints>(
  endpoints: E,
): JsonSchemaApiEndpoints => toEndpoints(toSchema, endpoints);

const toSchema = (s: z.ZodTypeAny) => {
  return createSchema(s).schema as JSONSchema7;
};
