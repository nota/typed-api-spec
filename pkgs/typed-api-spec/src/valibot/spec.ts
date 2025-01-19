import {
  AnyApiResponses,
  BaseApiSpec,
  DefineApiResponses,
  DefineResponse,
  Method,
  StatusCode,
} from "../core";
import { AnyV, InferOrUndefined } from "./util";

export type ValibotApiEndpoints = { [Path in string]: ValibotApiEndpoint };
export type ValibotApiEndpoint = Partial<Record<Method, ValibotApiSpec>>;
export type ValibotApiSpec<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string = string,
  Params extends AnyV = AnyV,
  Query extends AnyV = AnyV,
  Body extends AnyV = AnyV,
  RequestHeaders extends AnyV = AnyV,
  Responses extends AnyApiResponses = AnyApiResponses,
> = BaseApiSpec<Params, Query, Body, RequestHeaders, Responses>;
export type ToApiEndpoints<E extends ValibotApiEndpoints> = {
  [Path in keyof E & string]: ToApiEndpoint<E, Path>;
};
export type ToApiEndpoint<
  E extends ValibotApiEndpoints,
  Path extends keyof E,
> = {
  [M in keyof E[Path] & Method]: ToApiSpec<NonNullable<E[Path][M]>>;
};
export type ToApiSpec<ZAS extends ValibotApiSpec> = {
  query: InferOrUndefined<ZAS["query"]>;
  params: InferOrUndefined<ZAS["params"]>;
  body: InferOrUndefined<ZAS["body"]>;
  headers: InferOrUndefined<ZAS["headers"]>;
  responses: ToApiResponses<ZAS["responses"]>;
};
export type ToApiResponses<AR extends ValibotAnyApiResponses> = {
  [SC in keyof AR & StatusCode]: {
    body: InferOrUndefined<NonNullable<AR[SC]>["body"]>;
    headers: InferOrUndefined<NonNullable<AR[SC]>["headers"]>;
  };
};
export type ValibotAnyApiResponse = DefineResponse<AnyV, AnyV>;
export type ValibotAnyApiResponses = DefineApiResponses<ValibotAnyApiResponse>;
export type ValibotApiResponses = Partial<Record<StatusCode, AnyV>>;
export type ValibotApiResSchema<
  AResponses extends ValibotApiResponses,
  SC extends keyof AResponses & StatusCode,
> = AResponses[SC] extends AnyV ? AResponses[SC] : never;
