import {
  BaseApiSpec,
  DefineApiResponses,
  DefineResponse,
  Method,
  StatusCode,
} from ".";
import { StandardSchemaV1 } from "@standard-schema/spec";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStandardSchemaV1 = StandardSchemaV1<any>;

export type InferOrUndefined<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T>
  : undefined;

// -- spec --
export type ApiEndpointsSchema = { [Path in string]: ApiEndpointSchema };
export type ApiEndpointSchema = Partial<Record<Method, ApiSpecSchema>>;
export type ApiSpecSchema<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string = string,
  Params extends AnyStandardSchemaV1 = AnyStandardSchemaV1,
  Query extends AnyStandardSchemaV1 = AnyStandardSchemaV1,
  Body extends AnyStandardSchemaV1 = AnyStandardSchemaV1,
  RequestHeaders extends AnyStandardSchemaV1 = AnyStandardSchemaV1,
  Responses extends AnyApiResponsesSchema = AnyApiResponsesSchema,
> = BaseApiSpec<Params, Query, Body, RequestHeaders, Responses>;
export type ApiResponseSchema = DefineResponse<
  StandardSchemaV1,
  StandardSchemaV1
>;
export type ApiResponsesSchema = DefineApiResponses<ApiResponseSchema>;
export type AnyApiResponsesSchema = DefineApiResponses<
  DefineResponse<AnyStandardSchemaV1, AnyStandardSchemaV1>
>;

// -- converter --
export type ToApiEndpoints<E extends ApiEndpointsSchema> = {
  [Path in keyof E & string]: ToApiEndpoint<E, Path>;
};
export type ToApiEndpoint<
  E extends ApiEndpointsSchema,
  Path extends keyof E,
> = {
  [M in keyof E[Path] & Method]: ToApiSpec<NonNullable<E[Path][M]>>;
};
export type ToApiSpec<ZAS extends ApiSpecSchema> = {
  query: InferOrUndefined<ZAS["query"]>;
  params: InferOrUndefined<ZAS["params"]>;
  body: InferOrUndefined<ZAS["body"]>;
  headers: InferOrUndefined<ZAS["headers"]>;
  responses: ToApiResponses<ZAS["responses"]>;
};
export type ToApiResponses<AR extends ApiResponsesSchema> = {
  [SC in keyof AR & StatusCode]: {
    body: InferOrUndefined<NonNullable<AR[SC]>["body"]>;
    headers: InferOrUndefined<NonNullable<AR[SC]>["headers"]>;
  };
};
