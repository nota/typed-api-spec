import { ParseQueryString } from "./query-string";
import { ExtractByPrefix, SameSlashNum, Split, UndefinedTo } from "./type";
import { C } from "../compile-error-utils";

type ExtractParams<T extends string> = ExtractByPrefix<T, ":">;

/**
 * Extract URL parameters from URL pattern
 *
 * @example
 * ```
 * type T0 = ParseUrlParams<"/users/:userId">;
 * // => "userId"
 * ```
 */
export type ParseUrlParams<T extends string> = ExtractParams<
  Split<T, "/">[number]
>;

export type UrlSchema = "http" | "https" | "about" | "blob" | "data" | "file";
type UrlPrefix = `${UrlSchema}://` | "";
export type UrlPrefixPattern = `${UrlPrefix}${string}`;

type US<T> = UndefinedTo<T, "">;

/**
 * Convert URL definition to acceptable URL pattern
 *
 * @example
 * ```
 * type T0 = ToUrlParamPattern<"/users/:userId">;
 * // => "/users/${string}"
 * ```
 */
export type ToUrlParamPattern<
  T extends string,
  URL extends ParseURL<T> = ParseURL<T>,
  Schema extends string = URL["schema"] extends undefined
    ? ""
    : `${URL["schema"]}://`,
  Port extends string = URL["port"] extends undefined ? "" : `:${URL["port"]}`,
  Path extends string = PathToUrlParamPattern<URL["path"]>,
> = `${Schema}${US<URL["host"]>}${Port}${Path}`;

export type PathToUrlParamPattern<Path extends string> =
  Path extends `${infer Prefix}/${infer Suffix}`
    ? Prefix extends `${infer O}:${string}`
      ? `${O}${string}/${PathToUrlParamPattern<Suffix>}`
      : `${Prefix}/${PathToUrlParamPattern<Suffix>}`
    : Path extends `:${string}`
      ? string
      : `${Path}`;

/**
 * Convert URL definition with query to acceptable URL pattern
 *
 * @example
 * ```
 * type T0 = ToUrlPattern<"/users/:userId?key=value">;
 * // => "/users/${string}?key=value"
 * ```
 */
export type ToUrlPattern<T extends string> = T extends `${infer O}?${infer R}`
  ? `${ToUrlParamPattern<O>}?${ToUrlPattern<R>}`
  : ToUrlParamPattern<T>;

export type NoPathError = C.E<"no matched path found">;

/**
 * パスパターン内のパス変数が空文字列とマッチするかをチェックする型
 *
 * @example
 * ```
 * type T0 = HasEmptyPathVariableMatch<"/", "/:userId">; // true
 * type T1 = HasEmptyPathVariableMatch<"/users/123", "/users/:userId">; // false
 * ```
 */
export type HasEmptyPathVariableMatch<
  InputPath extends string,
  Pattern extends string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
> = Pattern extends `${infer Prefix}:${infer ParamName}/${infer Suffix}`
  ? InputPath extends `${Prefix}${infer Segment}/${infer Rest}`
    ? Segment extends ""
      ? true // Empty segment before slash = empty path variable match
      : HasEmptyPathVariableMatch<Rest, Suffix> // Non-empty segment, check rest
    : InputPath extends `${Prefix}${string}`
      ? true // Path ends here, but pattern continues with path variable
      : false
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Pattern extends `${infer Prefix}:${infer ParamName}`
    ? InputPath extends `${Prefix}${infer Segment}`
      ? Segment extends ""
        ? true // Empty segment at the end = empty path variable match
        : false // Non-empty segment at the end = no empty match
      : false
    : false; // No path variables in pattern = no empty match

/**
 * Extract matched URL pattern from URL
 * T: URL
 * Patterns: URL pattern candidates
 *
 * @example
 * ```
 * type T0 = MatchedPatterns<"/users/1", "/users/:userId" | "org/:orgId">;
 * // => "/users/:userId"
 * ```
 */
export type MatchedPatterns<
  Path extends string,
  Pattern extends string,
  Matched = {
    [P in Pattern as Path extends PathToUrlParamPattern<P>
      ? SameSlashNum<P, Path> extends true
        ? HasEmptyPathVariableMatch<Path, P> extends true
          ? never
          : P
        : never
      : never]: true;
  },
> = keyof Matched extends never ? NoPathError : keyof Matched;

/**
 * Parse host and port
 *
 * @example
 * ```
 * type T0 = ParseHostAndPort<"example.com">;
 * // => { host: "example.com", port: undefined }
 *
 * type T1 = ParseHostAndPort<"example.com:8080">;
 * // => { host: "example.com", port: "8080" }
 * ```
 */
export type ParseHostAndPort<T> = T extends `${infer Host}:${infer Port}`
  ? Port extends `${number}`
    ? { host: Host; port: Port }
    : never
  : { host: T; port: undefined };

/**
 * Parse Origin and path
 *
 * @example
 * ```
 * type T0 = ParseOriginAndPath<"http://example.com:8080/path">;
 * // => { schema: "http", host: "example.com", port: "8080", path: "/path" }
 *
 * type T1 = ParseOriginAndPath<"/path">;
 * // => { schema: undefined, host: undefined, port: undefined, path: "/path" }
 * ```
 */
export type ParseOriginAndPath<T> =
  T extends `${infer S extends UrlSchema}://${infer Rest}`
    ? // URL Schemaを含むケース
      Rest extends `${infer Prefix}/${infer Suffix}`
      ? ParseHostAndPort<Prefix> & { schema: S; path: `/${Suffix}` }
      : ParseHostAndPort<Rest> & { schema: S; path: `` }
    : // URL Schemaを含まないケース
      T extends string
      ? { schema: undefined; host: undefined; port: undefined; path: T }
      : never;

type SplitUrlAndQueryString<S extends string> =
  S extends `${infer URL}?${infer QS}`
    ? { url: URL; qs: QS }
    : { url: S; qs: never };

/**
 * Parse URL
 * Note: currently query string parsing is not working
 *
 * @example
 * ```
 * type T0 = ParseURL<"http://example.com:8080/path?key=value">;
 * // => { schema: "http", host: "example.com", port: "8080", path: "/path", query: { key: "value" } }
 * ```
 */
export type ParseURL<T extends string> = ParseOriginAndPath<
  SplitUrlAndQueryString<T>["url"]
> & {
  query: SplitUrlAndQueryString<T>["qs"] extends string
    ? ParseQueryString<SplitUrlAndQueryString<T>["qs"]>
    : Record<string, never>;
};

/**
 * Normalize path
 *
 * @example
 * ```
 * type T0 = NormalizePath<"users//:userId">;
 * // => "users/:userId"
 * ```
 */
export type NormalizePath<T extends string> = T extends `${infer P}//${infer Q}`
  ? NormalizePath<`${P}/${Q}`>
  : T;
