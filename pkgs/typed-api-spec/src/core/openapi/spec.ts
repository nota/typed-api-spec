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
export type JsonSchemaOpenApiEndpoint =
  DefineOpenApiEndpoint<JsonSchemaOpenApiSpec>;
export type DefineOpenApiEndpoint<Spec extends AnyOpenApiSpec> = Partial<
  Record<Method, Spec>
> & {
  $ref?: string;
  summary?: string;
  description?: string;
  servers?: OpenAPIV3_1.ServerObject[];
};
export type OperationObject = Omit<
  OpenAPIV3_1.OperationObject,
  "requestBody" | "parameters" | "responses"
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
} & OperationObject;
export type ToOpenApiResponse<R extends AnyResponse> = R &
  OpenAPIV3_1.ResponseObject;
export type AnyOpenApiResponses = DefineOpenApiResponses<AnyResponse>;
export type DefineOpenApiResponses<R extends AnyResponse> = DefineApiResponses<
  ToOpenApiResponse<R>
>;
