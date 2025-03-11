import { memoize, tupleIteratorToObject, unreachable } from "../utils";
import { match } from "path-to-regexp";
import { Method, SSResult, StatusCode } from "../core";
import { AnySpecValidator, runSpecValidator } from "../core";
import { AnyResponseSpecValidator, runResponseSpecValidator } from "../core";
import { StandardSchemaV1 } from "@standard-schema/spec";
import { newSSValidator, SSApiEndpoints } from "../core/ss";

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

const newErrorHandler = (policy: "throw" | "log") => {
  return (
    results: ReturnType<typeof runSpecValidator>,
    error: Readonly<StandardSchemaV1.Issue[]>,
  ) => {
    switch (policy) {
      case "throw":
        if (error) {
          console.log(error);
          throw new SpecValidatorError("preCheck", error);
        }
        handleValidatorsError(results, (reason, error) => {
          throw new SpecValidatorError(reason, error);
        });
        break;
      case "log":
        if (error) {
          console.error(new SpecValidatorError("preCheck", error));
        }
        handleValidatorsError(results, (reason, error) => {
          console.error(new SpecValidatorError(reason, error));
        });
        break;
      default:
        unreachable(policy);
    }
  };
};
const newResponseErrorHandler = (policy: "throw" | "log") => {
  return (results: ReturnType<typeof runResponseSpecValidator>) => {
    switch (policy) {
      case "throw":
        handleResponseValidatorsError(results, (reason, error) => {
          throw new SpecValidatorError(reason, error);
        });
        break;
      case "log":
        handleResponseValidatorsError(results, (reason, error) => {
          console.error(new SpecValidatorError(reason, error));
        });
        break;
      default:
        unreachable(policy);
    }
  };
};

export const withValidation = <
  Fetch extends typeof fetch,
  // Validators extends RequestSpecValidatorGenerator,
  // ResponseValidators extends ResponseSpecValidatorGenerator,
  Endpoints extends SSApiEndpoints,
>(
  f: Fetch,
  endpoints: Endpoints,
  // validatorGenerator: Validators,
  // responseValidatorGenerator: ResponseValidators,
  options: { policy: "throw" | "log" } = { policy: "throw" },
): Fetch => {
  const toInputWithMatcher = toInput(newPathMather(endpoints));
  const handleError = newErrorHandler(options.policy);
  const handleResponseError = newResponseErrorHandler(options.policy);
  const validator0 = newSSValidator(endpoints);
  const ftc = async (...args: Parameters<Fetch>) => {
    const [input, init] = args;
    const vInput = toInputWithMatcher(input, init);
    const { data: validator, error } = validator0.req(vInput);
    // FIXME
    handleError(runSpecValidator(validator), [{ message: "", ...error }]);
    const res = await f(input, init);
    const res1 = res.clone();
    // TODO: jsonじゃない時どうするか
    // TODO: response bodyを直接渡すのはおかしい
    const headers: Record<string, string> = {};
    res1.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const responseValidator = validator0.res({
      path: vInput.path,
      // FIXME: 雑にキャストしていいんだっけ?
      method: vInput.method as Method,
      statusCode: res1.status as StatusCode,
      body: await res1.json(),
      headers: headersToRecord(res1.headers ?? {}),
    });
    handleResponseError(runResponseSpecValidator(responseValidator));
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

const handleValidatorsError = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: Record<Exclude<keyof AnySpecValidator, "responses">, SSResult<any>>,
  cb: (
    reason: keyof AnySpecValidator,
    error: Readonly<StandardSchemaV1.Issue[]>,
  ) => void,
) => {
  let params = results.params;
  if (params instanceof Promise) {
    params = await params;
  }
  if (params.issues) {
    cb("params", params.issues);
  }
  let query = results.query;
  if (query instanceof Promise) {
    query = await query;
  }
  if (query.issues) {
    cb("query", query.issues);
  }
  let body = results.body;
  if (body instanceof Promise) {
    body = await body;
  }
  if (body.issues) {
    cb("body", body.issues);
  }
  let headers = results.headers;
  if (headers instanceof Promise) {
    headers = await headers;
  }
  if (headers.issues) {
    cb("headers", headers.issues);
  }
};

const handleResponseValidatorsError = async (
  results: Record<
    Exclude<keyof AnyResponseSpecValidator, "responses">,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SSResult<any>
  >,
  cb: (
    reason: keyof AnySpecValidator,
    error: Readonly<StandardSchemaV1.Issue[]>,
  ) => void,
) => {
  let body = results.body;
  if (body instanceof Promise) {
    body = await body;
  }
  if (body.issues) {
    cb("body", body.issues);
  }
  let headers = results.headers;
  if (headers instanceof Promise) {
    headers = await headers;
  }
  if (headers.issues) {
    cb("headers", headers.issues);
  }
};
