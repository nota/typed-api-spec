import {
  AnyResponse,
  DefineApiResponses,
  JsonSchemaResponse,
  Method,
} from "../spec";
import { OpenAPIV3_1 } from "openapi-types";
import { JSONSchema7 } from "json-schema";

export type JsonSchemaOpenApiEndpoints = {
  [Path in string]: JsonSchemaOpenApiEndpoint;
};
export type JsonSchemaOpenApiEndpoint = Partial<
  Record<Method, JsonSchemaOpenApiSpec>
>;
export type PathItemObject = Omit<
  OpenAPIV3_1.PathItemObject,
  "parameters" | "responses" | "requestBody"
>;
export type JsonSchemaOpenApiSpec = BaseOpenApiSpec<
  JSONSchema7,
  JSONSchema7,
  JSONSchema7,
  JSONSchema7,
  JsonSchemaOpenApiResponses
>;
export type JsonSchemaOpenApiResponses =
  DefineOpenApiResponses<JsonSchemaResponse>;

export type AnyOpenApiSpec = BaseOpenApiSpec<
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  AnyOpenApiResponses // eslint-disable-line @typescript-eslint/no-explicit-any
>;

export type BaseOpenApiSpec<
  Params,
  Query,
  Body,
  RequestHeaders,
  Responses extends AnyOpenApiResponses,
> = {
  query?: Query;
  params?: Params;
  body?: Body;
  responses: Responses;
  headers?: RequestHeaders;
} & PathItemObject;
export type ToOpenApiResponse<R extends AnyResponse> = R &
  OpenAPIV3_1.ResponseObject;
export type AnyOpenApiResponses = DefineOpenApiResponses<AnyResponse>;
export type DefineOpenApiResponses<R extends AnyResponse> = DefineApiResponses<
  ToOpenApiResponse<R>
>;
