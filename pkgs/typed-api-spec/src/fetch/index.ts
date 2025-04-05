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
      ? true
      : false
    : false,
> = [QueryRequiredError] extends [true]
  ? QueryParameterRequiredError
  : // If Url is given as like "https://example.com?${string}", then QueryKeys will be string
    string extends QueryKeys
    ? C.OK
    : ValidateQuery<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
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
      : // eslint-disable-next-line @typescript-eslint/ban-types
        {}) &
  (HeadersObj extends Record<string, string>
    ? IsAllOptional<HeadersObj> extends true
      ? { headers?: HeadersObj | Headers }
      : { headers: HeadersObj | Headers }
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {});

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
   * @template UrlPattern - Acceptable URL pattern
   * For example, if endpoints are defined as below:
   * { "/users": ..., "/users/:userId": ... }
   * and UrlPrefix is "https://example.com",
   * then UrlPattern will be "https://example.com/users" | "https://example.com/users/${string}"
   *
   * @template Input - Input of the request by the user
   * For example, if endpoints are defined as below:
   * { "/users": ..., "/users/:userId": ... }
   * then Input accepts "https://example.com/users" | "https://example.com/users/${string}"
   * If query is defined in the spec, Input also accepts "https://example.com/users?${string}" | "https://example.com/users/${string}?${string}"
   *
   * @template InputPath - Converted path from `Input`
   * For example, if Input is "https://example.com/users/1", then InputPath will be "/users/${string}"
   *
   * @template CandidatePaths - Matched paths from `InputPath` and `keyof E`
   * For example, if InputPath is "/users/1" and endpoints are defined as below:
   * { "/users": ..., "/users/:userId": ... }
   * then CandidatePaths will be "/users/:userId"
   * If no matched path is found, CandidatePaths will be never
   * If multiple matched paths are found, CandidatePaths will be a union of matched paths
   *
   * @template AcceptableMethods - Acceptable methods for the matched path
   * For example, if CandidatePaths is "/users/:userId" and endpoints are defined as below:
   * { "/users": { get: ... }, "/users/:userId": { get: ..., post: ... } }
   * then AcceptableMethods will be "get" | "post"
   *
   * @template LM - Lowercase version of `InputMethod`
   *
   * @template Query - Query object of the endpoint that matches `CandidatePaths`
   *
   * @template Headers - Request headers object of the endpoint
   *
   * @template Body - Request body object of the endpoint
   *
   * @template Response - Response object of the endpoint that matches `CandidatePaths`
   *
   * @template ValidatedUrl - Result of URL validation
   *
   * @template InputMethod - Method of the request as specified by the user
   * For example, if `fetch` is called with `fetch("https://example.com/users", { method: "post" })`,
   * then InputMethod will be "post".
   * If `get` method is defined in the spec, method can be omitted, and it will be `get` by default
   *
   * @template CanOmitMethod - Whether the method property in the "init" parameter can be omitted
   * If the endpoint defines a "get" method, then the method can be omitted
   *
   * @template CanOmitInit - Whether the "init" parameter can be omitted for the request
   * If the method can be omitted (`CanOmitMethod` is true) and the endpoint does not require headers, then the "init" parameter can be omitted
   */
  UrlPattern extends ToUrlParamPattern<`${UrlPrefix}${keyof E & string}`>,
  Input extends Query extends undefined
    ? UrlPattern
    : IsAllOptional<Query> extends true
      ? UrlPattern | `${UrlPattern}?${string}`
      : `${UrlPattern}?${string}`,
  InputPath extends PathToUrlParamPattern<
    NormalizePath<
      ParseURL<Replace<Input, ToUrlParamPattern<UrlPrefix>, "">>["path"]
    >
  >,
  CandidatePaths extends MatchedPatterns<InputPath, keyof E & string>,
  AcceptableMethods extends CandidatePaths extends string
    ? Extract<Method, keyof E[CandidatePaths]>
    : never,
  LM extends Lowercase<InputMethod>,
  Query extends ApiP<E, CandidatePaths, LM, "query">,
  Headers extends ApiP<E, CandidatePaths, LM, "headers">,
  Body extends ApiP<E, CandidatePaths, LM, "body">,
  Response extends ApiP<
    E,
    CandidatePaths,
    LM,
    "responses"
  > extends AnyApiResponses
    ? MergeApiResponseBodies<ApiP<E, CandidatePaths, LM, "responses">>
    : Record<StatusCode, never>,
  ValidatedUrl extends ValidateUrl<Query, Input>,
  InputMethod extends CaseInsensitive<AcceptableMethods> = Extract<
    AcceptableMethods,
    "get"
  >,
  CanOmitMethod extends boolean = "get" extends AcceptableMethods
    ? true
    : false,
  CanOmitInit extends boolean = CanOmitMethod extends true
    ? Headers extends undefined
      ? true
      : Headers extends Record<string, string>
        ? IsAllOptional<Headers> extends true
          ? true
          : false
        : false
    : false,
>(
  input: [ValidatedUrl] extends [C.OK | QueryParameterRequiredError]
    ? Input
    : ValidatedUrl,
  ...args: CanOmitInit extends true
    ? [init?: RequestInitT<CanOmitMethod, Body, Headers, InputMethod>]
    : [init: RequestInitT<CanOmitMethod, Body, Headers, InputMethod>]
) => Promise<Response>;

export default FetchT;

export * from "./validation";
export * from "./new-fetch";
