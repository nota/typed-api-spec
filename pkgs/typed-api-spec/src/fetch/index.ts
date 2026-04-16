import {
  ApiEndpoints,
  ApiP,
  AnyApiResponses,
  CaseInsensitiveMethod,
  MatchedPatterns,
  MergeApiResponseBodies,
  NormalizePath,
  ParseURL,
  PathToUrlParamPattern,
  Replace,
  StatusCode,
  IsAllOptional,
  ExtractQuery,
  ValidateQuery,
  ToQueryUnion,
  Method,
  CaseInsensitive,
  And,
} from "../core";
import { UrlPrefixPattern, ToUrlParamPattern } from "../core";
import { TypedString } from "../json";
import { C } from "../compile-error-utils";

export type QueryParameterRequiredError = C.E<"query parameter required">;
export type ValidateUrl<
  QueryDef extends Record<string, unknown> | undefined,
  Url extends string,
  // -- local types --
  Query extends string | undefined = ExtractQuery<Url>,
  QueryKeys extends string = [Query] extends [string]
    ? ToQueryUnion<Query>
    : never,
  QueryRequiredError extends boolean = [QueryDef] extends [
    Record<string, unknown>,
  ]
    ? [QueryKeys] extends [never]
      ? IsAllOptional<QueryDef & Record<string, unknown>> extends true
        ? false
        : true
      : false
    : false,
> = [QueryRequiredError] extends [true]
  ? QueryParameterRequiredError
  : // If Url is given as like "https://example.com?${string}", then QueryKeys will be string
    string extends QueryKeys
    ? C.OK
    : ValidateQuery<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
        QueryDef extends Record<string, any> ? QueryDef : {},
        QueryKeys
      >;

export type RequestInitT<
  CanOmitMethod extends boolean,
  Body extends Record<string, unknown> | string | undefined,
  HeadersObj extends string | Record<string, string> | undefined,
  InputMethod extends CaseInsensitiveMethod,
> = Omit<RequestInit, "method" | "body" | "headers"> &
  (CanOmitMethod extends true
    ? { method?: InputMethod }
    : { method: InputMethod }) &
  (Body extends Record<string, unknown>
    ? IsAllOptional<Body> extends true
      ? { body?: Body | TypedString<Body> }
      : { body: TypedString<Body> }
    : Body extends string
      ? { body: string }
      : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        {}) &
  (HeadersObj extends Record<string, string>
    ? IsAllOptional<HeadersObj> extends true
      ? { headers?: HeadersObj | Headers }
      : { headers: HeadersObj | Headers }
    : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {});

// -- Helper types for FetchT --

/**
 * Acceptable URL pattern
 * For example, if endpoints are defined as below:
 * { "/users": ..., "/users/:userId": ... }
 * and UrlPrefix is "https://example.com",
 * then FetchUrlPattern will be "https://example.com/users" | "https://example.com/users/${string}"
 */
type FetchUrlPattern<
  UrlPrefix extends UrlPrefixPattern,
  E extends ApiEndpoints,
> = ToUrlParamPattern<`${UrlPrefix}${keyof E & string}`>;

/**
 * Converted path from `Input`
 * For example, if Input is "https://example.com/users/1", then FetchInputPath will be "/users/${string}"
 */
type FetchInputPath<
  Input extends string,
  UrlPrefix extends UrlPrefixPattern,
> = PathToUrlParamPattern<
  NormalizePath<
    ParseURL<Replace<Input, ToUrlParamPattern<UrlPrefix>, "">>["path"] & string
  >
>;

/**
 * Matched paths from `InputPath` and `keyof E`
 * For example, if InputPath is "/users/1" and endpoints are defined as below:
 * { "/users": ..., "/users/:userId": ... }
 * then FetchCandidatePaths will be "/users/:userId"
 * If no matched path is found, FetchCandidatePaths will be never
 * If multiple matched paths are found, FetchCandidatePaths will be a union of matched paths
 */
type FetchCandidatePaths<
  Input extends string,
  UrlPrefix extends UrlPrefixPattern,
  E extends ApiEndpoints,
> = MatchedPatterns<
  FetchInputPath<Input, UrlPrefix> & string,
  keyof E & string
>;

/**
 * Acceptable methods for the matched path
 * For example, if CandidatePaths is "/users/:userId" and endpoints are defined as below:
 * { "/users": { get: ... }, "/users/:userId": { get: ..., post: ... } }
 * then FetchAcceptableMethods will be "get" | "post"
 */
type FetchAcceptableMethods<
  Input extends string,
  UrlPrefix extends UrlPrefixPattern,
  E extends ApiEndpoints,
> =
  FetchCandidatePaths<Input, UrlPrefix, E> extends string
    ? Extract<Method, keyof E[FetchCandidatePaths<Input, UrlPrefix, E>]>
    : never;

/** Extract a specific property (query, headers, body, responses) from the matched endpoint. */
type FetchApiProp<
  Input extends string,
  UrlPrefix extends UrlPrefixPattern,
  E extends ApiEndpoints,
  InputMethod extends string,
  P extends "query" | "headers" | "body" | "responses",
> = ApiP<
  E,
  FetchCandidatePaths<Input, UrlPrefix, E>,
  Lowercase<InputMethod>,
  P
>;

/** Response object of the endpoint that matches `CandidatePaths` */
type FetchResponse<
  Input extends string,
  UrlPrefix extends UrlPrefixPattern,
  E extends ApiEndpoints,
  InputMethod extends string,
> =
  FetchApiProp<
    Input,
    UrlPrefix,
    E,
    InputMethod,
    "responses"
  > extends AnyApiResponses
    ? MergeApiResponseBodies<
        FetchApiProp<Input, UrlPrefix, E, InputMethod, "responses">
      >
    : Record<StatusCode, never>;

/**
 * Whether the method property in the "init" parameter can be omitted
 * If the endpoint defines a "get" method, then the method can be omitted
 */
type FetchCanOmitMethod<
  Input extends string,
  UrlPrefix extends UrlPrefixPattern,
  E extends ApiEndpoints,
> = "get" extends FetchAcceptableMethods<Input, UrlPrefix, E> ? true : false;

/** Whether the headers property in the "init" parameter can be omitted */
type FetchCanOmitHeaders<
  Input extends string,
  UrlPrefix extends UrlPrefixPattern,
  E extends ApiEndpoints,
  InputMethod extends string,
  Headers = FetchApiProp<Input, UrlPrefix, E, InputMethod, "headers">,
> = Headers extends undefined
  ? true
  : IsAllOptional<Headers & Record<string, unknown>>;

/** Whether the body property in the "init" parameter can be omitted */
type FetchCanOmitBody<
  Input extends string,
  UrlPrefix extends UrlPrefixPattern,
  E extends ApiEndpoints,
  InputMethod extends string,
  Body = FetchApiProp<Input, UrlPrefix, E, InputMethod, "body">,
> = Body extends undefined
  ? true
  : IsAllOptional<Body & Record<string, unknown>>;

/**
 * Whether the "init" parameter can be omitted for the request
 * If the method can be omitted (`CanOmitMethod` is true), headers can be omitted (`CanOmitHeaders` is true), and body can be omitted (`CanOmitBody` is true), then the "init" parameter can be omitted
 */
type FetchCanOmitInit<
  Input extends string,
  UrlPrefix extends UrlPrefixPattern,
  E extends ApiEndpoints,
  InputMethod extends string,
> = And<
  [
    FetchCanOmitMethod<Input, UrlPrefix, E>,
    FetchCanOmitHeaders<Input, UrlPrefix, E, InputMethod>,
    FetchCanOmitBody<Input, UrlPrefix, E, InputMethod>,
  ]
>;

/** Result of URL validation */
type FetchValidatedUrl<
  Input extends string,
  UrlPrefix extends UrlPrefixPattern,
  E extends ApiEndpoints,
  InputMethod extends string,
> = ValidateUrl<FetchApiProp<Input, UrlPrefix, E, InputMethod, "query">, Input>;

/** Compute the input parameter type: Input if valid, otherwise the validation error. */
type FetchInputType<
  Input extends string,
  UrlPrefix extends UrlPrefixPattern,
  E extends ApiEndpoints,
  InputMethod extends string,
  Validated = FetchValidatedUrl<Input, UrlPrefix, E, InputMethod>,
> = [Validated] extends [C.OK] ? Input : Validated;

/**
 * FetchT is a type for window.fetch like function but more strict type information
 *
 * @template UrlPrefix - URL prefix of `Input`
 * For example, if `UrlPrefix` is "https://example.com", then `Input` must be `https://example.com/${string}`
 *
 * @template E - ApiEndpoints
 * E is used to infer the type of the acceptable path, response body, and more
 */
type FetchT<UrlPrefix extends UrlPrefixPattern, E extends ApiEndpoints> = <
  /**
   * Internal type for FetchT
   * They are not supposed to be specified by the user
   *
   * @template Input - Input of the request by the user
   * For example, if endpoints are defined as below:
   * { "/users": ..., "/users/:userId": ... }
   * then Input accepts "https://example.com/users" | "https://example.com/users/${string}"
   * If query is defined in the spec, Input also accepts "https://example.com/users?${string}" | "https://example.com/users/${string}?${string}"
   *
   * @template InputMethod - Method of the request as specified by the user
   * For example, if `fetch` is called with `fetch("https://example.com/users", { method: "post" })`,
   * then InputMethod will be "post".
   * If `get` method is defined in the spec, method can be omitted, and it will be `get` by default
   *
   * @template Response - Response object of the endpoint that matches `CandidatePaths`
   *
   * Other types (InputPath, CandidatePaths, AcceptableMethods, Query, Headers,
   * Body, etc.) are computed via helper types (Fetch*) rather than type parameters,
   * to avoid circular type parameter constraints in TypeScript 6+.
   */
  Input extends
    | FetchUrlPattern<UrlPrefix, E>
    | `${FetchUrlPattern<UrlPrefix, E>}?${string}`,
  InputMethod extends CaseInsensitive<
    FetchAcceptableMethods<Input, UrlPrefix, E>
  > = Extract<FetchAcceptableMethods<Input, UrlPrefix, E>, "get">,
  Response = FetchResponse<Input, UrlPrefix, E, InputMethod>,
>(
  input: FetchInputType<Input, UrlPrefix, E, InputMethod>,
  ...args: FetchCanOmitInit<Input, UrlPrefix, E, InputMethod> extends true
    ? [
        init?: RequestInitT<
          FetchCanOmitMethod<Input, UrlPrefix, E>,
          FetchApiProp<Input, UrlPrefix, E, InputMethod, "body"> &
            (Record<string, unknown> | string | undefined),
          FetchApiProp<Input, UrlPrefix, E, InputMethod, "headers"> &
            (string | Record<string, string> | undefined),
          InputMethod & CaseInsensitiveMethod
        >,
      ]
    : [
        init: RequestInitT<
          FetchCanOmitMethod<Input, UrlPrefix, E>,
          FetchApiProp<Input, UrlPrefix, E, InputMethod, "body"> &
            (Record<string, unknown> | string | undefined),
          FetchApiProp<Input, UrlPrefix, E, InputMethod, "headers"> &
            (string | Record<string, string> | undefined),
          InputMethod & CaseInsensitiveMethod
        >,
      ]
) => Promise<Response>;

export default FetchT;

export * from "./validation";
export * from "./new-fetch";
