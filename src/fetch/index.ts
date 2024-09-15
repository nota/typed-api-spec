import {
  ApiEndpoints,
  ApiHasP,
  ApiP,
  AnyApiResponses,
  CaseInsensitiveMethod,
  FilterNever,
  MatchedPatterns,
  MergeApiResponseBodies,
  Method,
  NormalizePath,
  ParseURL,
  PathToUrlParamPattern,
  Replace,
  StatusCode,
  IsAllOptional,
} from "../common";
import { UrlPrefixPattern, ToUrlParamPattern } from "../common";
import { TypedString } from "../json";

export type RequestInitT<
  InputMethod extends CaseInsensitiveMethod,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Body extends Record<string, any> | undefined,
  HeadersObj extends Record<string, string> | undefined,
> = Omit<RequestInit, "method" | "body" | "headers"> & {
  method?: InputMethod;
} & FilterNever<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: Body extends Record<string, any>
      ? IsAllOptional<Body> extends true
        ? Body | TypedString<Body> | undefined
        : TypedString<Body>
      : never;
    headers: HeadersObj extends Record<string, string>
      ? IsAllOptional<HeadersObj> extends true
        ? HeadersObj | Headers | undefined
        : HeadersObj | Headers
      : never;
  }>;

/**
 * FetchT is a type for window.fetch like function but more strict type information
 */
type FetchT<UrlPrefix extends UrlPrefixPattern, E extends ApiEndpoints> = <
  Input extends Query extends undefined
    ? ToUrlParamPattern<`${UrlPrefix}${keyof E & string}`>
    : `${ToUrlParamPattern<`${UrlPrefix}${keyof E & string}`>}?${string}`,
  InputPath extends PathToUrlParamPattern<
    NormalizePath<
      ParseURL<Replace<Input, ToUrlParamPattern<UrlPrefix>, "">>["path"]
    >
  >,
  CandidatePaths extends string = MatchedPatterns<InputPath, keyof E & string>,
  InputMethod extends CaseInsensitiveMethod = "get",
  M extends Method = Lowercase<InputMethod>,
  Query extends ApiP<E, CandidatePaths, M, "query"> = ApiP<
    E,
    CandidatePaths,
    M,
    "query"
  >,
  ResBody extends ApiP<
    E,
    CandidatePaths,
    M,
    "responses"
  > extends AnyApiResponses
    ? MergeApiResponseBodies<ApiP<E, CandidatePaths, M, "responses">>
    : Record<StatusCode, never> = ApiP<
    E,
    CandidatePaths,
    M,
    "responses"
  > extends AnyApiResponses
    ? MergeApiResponseBodies<ApiP<E, CandidatePaths, M, "responses">>
    : Record<StatusCode, never>,
>(
  input: Input,
  init: ApiHasP<E, CandidatePaths, M> extends true
    ? RequestInitT<
        InputMethod,
        ApiP<E, CandidatePaths, M, "body">,
        ApiP<E, CandidatePaths, M, "headers">
      >
    :
        | RequestInitT<
            InputMethod,
            ApiP<E, CandidatePaths, M, "body">,
            ApiP<E, CandidatePaths, M, "headers">
          >
        | undefined,
) => Promise<ResBody>;

export default FetchT;
