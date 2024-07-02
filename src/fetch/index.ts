import {
  ApiEndpoints,
  ApiP,
  CaseInsensitiveMethod,
  MergeApiResponses,
  Method,
  NormalizePath,
  ParseURL,
  Replace,
} from "../common";
import {
  MatchedPatterns,
  UrlPrefixPattern,
  ToUrlParamPattern,
} from "../common";
import { TypedString } from "../json";

export interface RequestInitT<
  InputMethod extends CaseInsensitiveMethod,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Body extends Record<string, any> | undefined,
  HeadersObj extends Record<string, string> | undefined,
> extends RequestInit {
  method?: InputMethod;
  body?: TypedString<Body>;
  // FIXME: no optional
  headers?: HeadersObj extends Record<string, string>
    ? HeadersObj | Headers
    : never;
}

/**
 * FetchT is a type for window.fetch like function but more strict type information
 */
type FetchT<UrlPrefix extends UrlPrefixPattern, E extends ApiEndpoints> = <
  Input extends
    | `${ToUrlParamPattern<UrlPrefix>}${ToUrlParamPattern<keyof E & string>}`
    | `${ToUrlParamPattern<UrlPrefix>}${ToUrlParamPattern<keyof E & string>}?${string}`,
  InputPath extends ParseURL<
    Replace<NormalizePath<Input>, NormalizePath<UrlPrefix>, "">
  >["path"],
  CandidatePaths extends MatchedPatterns<InputPath, keyof E & string>,
  InputMethod extends CaseInsensitiveMethod = "get",
  M extends Method = Lowercase<InputMethod>,
>(
  input: Input,
  init?: RequestInitT<
    InputMethod,
    ApiP<E, CandidatePaths, M, "body">,
    ApiP<E, CandidatePaths, M, "headers">
  >,
  // FIXME: NonNullable
) => Promise<MergeApiResponses<NonNullable<E[CandidatePaths][M]>["resBody"]>>;

export default FetchT;
