import {
  DefaultBodyType,
  HttpHandler,
  PathParams,
  RequestHandlerOptions,
  HttpResponse as MswHttpResponse,
  StrictResponse,
  http,
  ResponseResolver,
} from "msw";
import {
  AnyApiResponses,
  ApiEndpointsSchema,
  ApiP,
  ApiResBody,
  Method,
  newValidator,
  Replace,
  StatusCode,
  ToApiEndpoints,
  ToValidators,
  UrlPrefixPattern,
} from "../core";

// ported from msw(src/core/handlers/HttpHandler.ts)
export type HttpRequestResolverExtras<Params extends PathParams> = {
  params: Params;
  cookies: Record<string, string>;
};

/**
 * Http is a type for MSW http handler with strict type checking
 *
 * @template UrlPrefix - url prefix of `Input`
 * For example, if `UrlPrefix` is "https://example.com", then `Input` must be `https://example.com/${string}`
 *
 * @template ES - ApiEndpointsSchema
 * ES is used to infer the type of the acceptable path, response body, and more
 */
export type Http<
  UrlPrefix extends UrlPrefixPattern,
  ES extends ApiEndpointsSchema,
> = {
  all: HttpRequestHandler<UrlPrefix, ES, Method>;
  head: HttpRequestHandler<UrlPrefix, ES, "head">;
  get: HttpRequestHandler<UrlPrefix, ES, "get">;
  post: HttpRequestHandler<UrlPrefix, ES, "post">;
  put: HttpRequestHandler<UrlPrefix, ES, "put">;
  delete: HttpRequestHandler<UrlPrefix, ES, "delete">;
  patch: HttpRequestHandler<UrlPrefix, ES, "patch">;
  options: HttpRequestHandler<UrlPrefix, ES, "options">;
};

/**
 * HttpRequestHandler is a type for MSW's request handler with strict type checking
 *
 * @template UrlPrefix - url prefix of `Input`
 * For example, if `UrlPrefix` is "https://api.example.com", then `Input` must be "https://api.example.com/users"
 *
 * @template ES - ApiEndpointsSchema
 * For example, `{ "/users": { get: { responses: { 200: UserSchema } } } }`
 *
 * @template M - HTTP Method type
 * For example, "get", "post", "put", etc.
 *
 * @template E - (internal) Converted ApiEndpoints from ApiEndpointsSchema
 * Internal type - typically not directly specified by users
 */
export type HttpRequestHandler<
  UrlPrefix extends UrlPrefixPattern,
  ES extends ApiEndpointsSchema,
  M extends Method,
  E extends ToApiEndpoints<ES> = ToApiEndpoints<ES>,
> = <
  /**
   * internal type for HttpRequestHandler
   * They are not supposed to be specified by the user
   *
   * @template Input - Full URL path including prefix
   * e.g. "https://api.example.com/users" or "https://api.example.com/users/123"
   *
   * @template InputPath - Path without prefix
   * e.g. if Input is "https://api.example.com/users/123", then InputPath will be "/users/123"
   *
   * @template Params - URL parameters from the path
   * @template Body - Request body type
   * @template Responses - Response definitions with status codes
   * @template ResBody - Response body type for default 200 response
   */
  Input extends `${UrlPrefix}${keyof E & string}`,
  InputPath extends Replace<Input, UrlPrefix, "">,
  Params extends E[InputPath][M]["params"],
  Body extends E[InputPath][M]["body"],
  Responses extends ApiP<E, InputPath, M, "responses"> extends AnyApiResponses
    ? ApiP<E, InputPath, M, "responses">
    : Record<string, never>,
  ResBody extends 200 extends keyof Responses
    ? ApiResBody<Responses, 200> extends DefaultBodyType
      ? ApiResBody<Responses, 200>
      : never
    : never,
>(
  path: Input,
  resolver: ResponseResolver<
    (Params extends PathParams<keyof Params>
      ? HttpRequestResolverExtras<Params>
      : Record<string, never>) &
      ExtraResolverArgs<ES, InputPath, M>,
    Body,
    ResBody
  >,
  options?: RequestHandlerOptions,
) => HttpHandler;

interface ResponseInit<SC extends StatusCode> {
  headers?: HeadersInit;
  status?: SC;
  statusText?: string;
}

interface HttpResponseInit<SC extends StatusCode> extends ResponseInit<SC> {
  type?: ResponseType;
}

/**
 * Typed HTTP response interface extending MSW's HttpResponse
 *
 * @template Responses - API response definitions with status codes
 * @template DefaultSC - Default status code
 * @template ResponseBody - Response body type for the default status code
 */
interface HttpResponse<
  Responses extends AnyApiResponses,
  DefaultSC extends keyof Responses & StatusCode = 200 & StatusCode,
  ResponseBody extends ApiResBody<Responses, DefaultSC> &
    DefaultBodyType = ApiResBody<Responses, DefaultSC> & DefaultBodyType,
> extends Omit<MswHttpResponse, "json"> {
  /**
   * Returns a typed JSON response
   *
   * @template NewSC - Status code for the response
   * @param body - Response body matching the schema for the given status code
   * @param init - Response initialization options
   * @returns Strict response with properly typed body
   */
  json: <NewSC extends keyof Responses & StatusCode>(
    body: ApiResBody<Responses, NewSC>,
    init?: HttpResponseInit<NewSC>,
  ) => StrictResponse<ResponseBody>;
}

/**
 * Additional arguments for the response resolver
 *
 * @template ES - API endpoints schema
 * @template Path - Path string from the schema
 * @template M - HTTP method
 */
type ExtraResolverArgs<
  ES extends ApiEndpointsSchema,
  Path extends keyof ToApiEndpoints<ES> & string,
  M extends Method,
> = {
  // validate returns validation result
  validate: ToValidators<ES, Path, M>;
  // response is same as HttpResponse but with more strict typing
  response: HttpResponse<ToApiEndpoints<ES>[Path][M]["responses"]>;
};

/**
 * Creates a new msw's http with strict type checking
 *
 * @template BaseUrl - Base URL prefix for all endpoints
 * @template ES - API endpoints schema definition
 * @param baseUrl - Base URL prefix that will be prepended to all paths
 * @param endpoints - API endpoints schema object
 * @returns msw's http with strict type checking
 */
export const newHttp = <
  BaseUrl extends UrlPrefixPattern,
  ES extends ApiEndpointsSchema,
>(
  baseUrl: BaseUrl,
  endpoints: ES,
): Http<BaseUrl, ES> => {
  const { req } = newValidator(endpoints);
  return new Proxy(http, {
    get(target, prop, receiver) {
      const requestHandler = Reflect.get(target, prop, receiver);
      if (prop === "all") {
        return requestHandler;
      }
      return <
        // FIXME: Record<string, string> should be PathParams<keyof Params>
        Params extends Record<string, string> = Record<string, string>,
        // Params extends PathParams<keyof Params> = PathParams,
        RequestBodyType extends DefaultBodyType = DefaultBodyType,
        ResponseBodyType extends DefaultBodyType = undefined,
        RequestPath extends string = string,
      >(
        path: RequestPath,
        resolver: ResponseResolver<
          // FIXME
          HttpRequestResolverExtras<Params> &
            ExtraResolverArgs<ES, RequestPath, Method>,
          RequestBodyType,
          ResponseBodyType
        >,
        options?: RequestHandlerOptions,
      ) => {
        const resolver2 = new Proxy(resolver, {
          apply(target, thisArg, args: Parameters<typeof resolver>) {
            const info = args[0];
            // FIXME: use iterator helpers
            const url = new URL(info.request.url);
            const query = Object.fromEntries(url.searchParams.entries());

            const headers: Record<string, string> = {};
            info.request.headers.forEach((value, key) => {
              headers[key] = value;
            });

            const { data: validator, error } = req({
              path: path.replace(baseUrl, ""),
              method: prop as Method,
              params: info.params,
              headers,
              query,
            });
            if (error) {
              // FIXME
              console.error(error);
              throw error;
            }

            return resolver({
              ...info,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              validate: validator as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              response: MswHttpResponse as any,
            });
          },
        });
        return requestHandler(path, resolver2, options);
      };
    },
  }) as Http<BaseUrl, ES>;
};
