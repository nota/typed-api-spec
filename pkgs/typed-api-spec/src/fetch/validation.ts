import { memoize, tupleIteratorToObject } from "../utils";
import { match } from "path-to-regexp";
import { Method, newValidator, StatusCode } from "../core";
import { AnySpecValidator, runSpecValidator } from "../core";
import { runResponseSpecValidator } from "../core";
import { StandardSchemaV1 } from "@standard-schema/spec";
import { ApiEndpointsSchema } from "../core/schema";

const dummyHost = "https://example.com";

// https://blog.jxck.io/entries/2024-06-14/url.parse.html
function parseURL(str: string) {
  try {
    return new URL(str, dummyHost);
  } catch (err) {
    return null;
  }
}

const headersToRecord = (headers: HeadersInit): Record<string, string> => {
  const result: Record<string, string> = {};
  const headersObj = new Headers(headers);
  headersObj.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

type MatchResult = {
  matched: string;
  params: Record<string, string | string[]>;
};
const newPathMather = <E extends Record<string, unknown>>(endpoints: E) => {
  const mMatch = memoize(match);
  return (path: string) => {
    // FIXME matchedはendpointsのkeys
    const ret: MatchResult[] = [];
    for (const definedPath of Object.keys(endpoints)) {
      const result = mMatch(definedPath)(path);
      if (!result) {
        continue;
      }
      ret.push({
        matched: definedPath,
        // TODO: こんな適当にキャストしていいんだっけ?
        params: result.params as Record<string, string | string[]>,
      });
    }
    return ret;
  };
};

const toInput =
  (matcher: (p: string) => MatchResult[]) =>
  <Fetch extends typeof fetch>(...args: Parameters<Fetch>) => {
    const [input, init] = args;
    const url = parseURL(input.toString());
    const candidatePaths = matcher(url?.pathname ?? "");
    const cp = candidatePaths[0] ?? { matched: "", params: {} };
    const query = tupleIteratorToObject(url?.searchParams?.entries() ?? []);

    return {
      path: cp.matched,
      method: init?.method?.toLowerCase() ?? "get",
      headers: headersToRecord(init?.headers ?? {}),
      params: cp.params,
      // FIXME: JSON APIじゃない時どうするか
      body: init?.body ? JSON.parse(init.body.toString()) : undefined,
      query,
    };
  };

const newErrorHandler2 = (policy: "throw" | "log") => {
  return (
    reason: keyof AnySpecValidator | "preCheck",
    errors: Readonly<StandardSchemaV1.Issue[]>,
  ) => {
    switch (policy) {
      case "throw":
        throw new SpecValidatorError(reason, errors);
        break;
      case "log":
        console.error(new SpecValidatorError(reason, errors));
        break;
      default:
        policy satisfies never;
    }
  };
};

export const withValidation = <
  Fetch extends typeof fetch,
  // Validators extends RequestSpecValidatorGenerator,
  // ResponseValidators extends ResponseSpecValidatorGenerator,
  Endpoints extends ApiEndpointsSchema,
>(
  f: Fetch,
  endpoints: Endpoints,
  // validatorGenerator: Validators,
  // responseValidatorGenerator: ResponseValidators,
  options: { policy: "throw" | "log" } = { policy: "throw" },
): Fetch => {
  const toInputWithMatcher = toInput(newPathMather(endpoints));
  const handleError = newErrorHandler2(options.policy);
  // const handleResponseError = newResponseErrorHandler(options.policy);
  const validator0 = newValidator(endpoints);
  const ftc = async (...args: Parameters<Fetch>) => {
    const [input, init] = args;
    const vInput = toInputWithMatcher(input, init);
    const { data: validator, error } = validator0.req(vInput);
    if (error) {
      handleError("preCheck", [error]);
      return;
    }
    console.log("req validator error", error);
    // FIXME
    runSpecValidator(validator, handleError);
    const res = await f(input, init);
    const res1 = res.clone();
    // TODO: jsonじゃない時どうするか
    // TODO: response bodyを直接渡すのはおかしい
    const headers: Record<string, string> = {};
    res1.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const { data: resValidator, error: resError } = validator0.res({
      path: vInput.path,
      // FIXME: 雑にキャストしていいんだっけ?
      method: vInput.method as Method,
      statusCode: res1.status as StatusCode,
      body: await res1.json(),
      headers: headersToRecord(res1.headers ?? {}),
    });
    if (resError) {
      handleError("preCheck", [resError]);
      return;
    }
    runResponseSpecValidator(resValidator, handleError);
    return res;
  };
  return ftc as Fetch;
};

export class SpecValidatorError extends Error {
  constructor(
    public reason: keyof AnySpecValidator | "preCheck",
    public error: Readonly<StandardSchemaV1.Issue[]>,
    public message: string = JSON.stringify({ reason, ...error }),
  ) {
    super("Validation error");
  }
}
