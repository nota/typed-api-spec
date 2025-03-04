import { Equal, Expect } from "./type-test";
import {
  MatchedPatterns,
  NoPathError,
  ParseHostAndPort,
  ParseOriginAndPath,
  ParseURL,
  ParseUrlParams,
  ToUrlParamPattern,
  ToUrlPattern,
  HasEmptyPathVariableMatch,
} from "./url";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ParseUrlParamsTestCases = [
  // @ts-expect-error undefined is not a string
  Expect<Equal<ParseUrlParams<undefined>, never>>,
  Expect<Equal<ParseUrlParams<"">, never>>,
  Expect<Equal<ParseUrlParams<"">, never>>,
  Expect<Equal<ParseUrlParams<":a">, "a">>,
  Expect<Equal<ParseUrlParams<"/:a">, "a">>,
  Expect<Equal<ParseUrlParams<"/:a/:b">, "a" | "b">>,
  Expect<Equal<ParseUrlParams<"/a/:b">, "b">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ToUrlParamPatternTestCases = [
  Expect<Equal<ToUrlParamPattern<"">, "">>,
  Expect<Equal<ToUrlParamPattern<"/">, "/">>,
  Expect<Equal<ToUrlParamPattern<":a">, string>>,
  Expect<Equal<ToUrlParamPattern<"/:a/b">, `/${string}/b`>>,
  Expect<Equal<ToUrlParamPattern<"/:a/:b">, `/${string}/${string}`>>,
  Expect<
    Equal<ToUrlParamPattern<"https://example.com">, "https://example.com">
  >,
  Expect<
    Equal<
      ToUrlParamPattern<"https://example.com/:a">,
      `https://example.com/${string}`
    >
  >,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ToUrlPatternTestCases = [
  Expect<Equal<ToUrlPattern<"">, "">>,
  Expect<Equal<ToUrlPattern<"/">, "/">>,
  Expect<Equal<ToUrlPattern<"/users/:userId">, `/users/${string}`>>,
  Expect<
    Equal<
      ToUrlPattern<"/users/:userId?key=value">,
      `/users/${string}?key=value`
    >
  >,
  Expect<Equal<ToUrlPattern<"https://example.com">, "https://example.com">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type MatchedPatternsTestCases = [
  Expect<Equal<MatchedPatterns<string, "">, NoPathError>>,
  Expect<Equal<MatchedPatterns<"", "">, "">>,
  Expect<Equal<MatchedPatterns<"/1", "/:userId">, "/:userId">>,
  Expect<
    Equal<MatchedPatterns<"/1", "/:userId" | "/:orgId">, "/:userId" | "/:orgId">
  >,
  Expect<
    Equal<
      MatchedPatterns<"/users/1", "/users/:userId" | "/:userId">,
      "/users/:userId"
    >
  >,
  Expect<
    Equal<
      MatchedPatterns<"/users/1", "/users/:userId" | "/org/:orgId">,
      "/users/:userId"
    >
  >,
  Expect<
    Equal<
      MatchedPatterns<
        "/users/1/profile",
        "/users/:userId" | "/users/:userId/profile"
      >,
      "/users/:userId/profile"
    >
  >,

  // そもそもマッチしないケース (NoPathErrorを返す)
  Expect<Equal<MatchedPatterns<"/", "/users/:userId">, NoPathError>>,
  Expect<Equal<MatchedPatterns<"/users", "/users/:userId">, NoPathError>>,
  Expect<Equal<MatchedPatterns<"/", "/:org/:repo">, NoPathError>>,
  Expect<Equal<MatchedPatterns<"/org1", "/:org/:repo">, NoPathError>>,

  // 空のパス変数があるケース (NoPathErrorを返す)
  Expect<Equal<MatchedPatterns<"/", "/:userId">, NoPathError>>,
  Expect<Equal<MatchedPatterns<"/users/", "/users/:userId">, NoPathError>>,
  Expect<
    Equal<MatchedPatterns<"/api/1/", "/api/:version/:resource">, NoPathError>
  >,

  // 空のパス変数がないケース (パターンを返す)
  Expect<
    Equal<MatchedPatterns<"/users/123", "/users/:userId">, "/users/:userId">
  >,
  Expect<Equal<MatchedPatterns<"/org1/repo1", "/:org/:repo">, "/:org/:repo">>,

  // 完全一致するケース
  Expect<Equal<MatchedPatterns<"/users", "/users">, "/users">>,
  Expect<Equal<MatchedPatterns<"/", "/">, "/">>,

  // パスパターンが複数あるケース
  Expect<
    Equal<
      MatchedPatterns<"/users/123", "/users/:userId" | "/users">,
      "/users/:userId"
    >
  >,
  Expect<
    Equal<MatchedPatterns<"/users", "/users/:userId" | "/users">, "/users">
  >,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ParseHostAndPortTestCases = [
  Expect<
    Equal<
      ParseHostAndPort<"example.com">,
      { host: "example.com"; port: undefined }
    >
  >,
  Expect<
    Equal<
      ParseHostAndPort<"example.com:8080">,
      { host: "example.com"; port: "8080" }
    >
  >,
  // If invalid port is specified, it should return never
  Expect<Equal<ParseHostAndPort<"example.com:xxx">, never>>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ParseOriginAndPathCases = [
  Expect<Equal<ParseOriginAndPath<undefined>, never>>,
  Expect<
    Equal<
      ParseOriginAndPath<"">,
      { schema: undefined; host: undefined; port: undefined; path: "" }
    >
  >,
  Expect<
    Equal<
      ParseOriginAndPath<"https://example.com/">,
      { host: "example.com"; port: undefined } & { schema: "https"; path: "/" }
    >
  >,
  Expect<
    Equal<
      ParseOriginAndPath<"https://example.com/user">,
      { host: "example.com"; port: undefined } & {
        schema: "https";
        path: "/user";
      }
    >
  >,

  Expect<
    Equal<
      ParseOriginAndPath<"https://example.com/users/:userId">,
      { host: "example.com"; port: undefined } & {
        schema: "https";
        path: "/users/:userId";
      }
    >
  >,

  Expect<
    Equal<
      ParseOriginAndPath<"https://example.com:8080/user">,
      { host: "example.com"; port: "8080" } & { schema: "https"; path: "/user" }
    >
  >,

  Expect<
    Equal<
      ParseOriginAndPath<"/user">,
      { schema: undefined; host: undefined; port: undefined; path: "/user" }
    >
  >,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ParseURLTestCases = [
  Expect<Equal<ParseURL<"/user?a=b">["path"], "/user">>,
  Expect<Equal<ParseURL<"https://example.com/user">["path"], "/user">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type HasEmptyPathVariableMatchTestCases = [
  // 空のパス変数があるケース (trueを返す)
  Expect<Equal<HasEmptyPathVariableMatch<"/", "/:userId">, true>>,
  Expect<Equal<HasEmptyPathVariableMatch<"/users/", "/users/:userId">, true>>,
  Expect<
    Equal<HasEmptyPathVariableMatch<"/api/1/", "/api/:version/:resource">, true>
  >,

  // 空のパス変数がないケース (falseを返す)
  Expect<
    Equal<HasEmptyPathVariableMatch<"/users/123", "/users/:userId">, false>
  >,
  Expect<
    Equal<
      HasEmptyPathVariableMatch<"/api/v1/users", "/api/:version/:resource">,
      false
    >
  >,
  Expect<
    Equal<
      HasEmptyPathVariableMatch<"/users/123/posts", "/users/:userId/posts">,
      false
    >
  >,

  // 複数のセグメントがあるケース
  Expect<Equal<HasEmptyPathVariableMatch<"/", "/:org/:repo">, true>>,
  Expect<Equal<HasEmptyPathVariableMatch<"/org1", "/:org/:repo">, true>>,
  Expect<Equal<HasEmptyPathVariableMatch<"/org1/repo1", "/:org/:repo">, false>>,

  // そもそもマッチしないケース(falseを返す)
  Expect<Equal<HasEmptyPathVariableMatch<"/", "/org/:repo">, false>>,
];
