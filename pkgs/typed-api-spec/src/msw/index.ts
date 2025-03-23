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

export type Http<
  UrlPrefix extends UrlPrefixPattern,
  ES extends ApiEndpointsSchema,
> = {
  all: HttpRequestHandler<ES, Method>;
  head: HttpRequestHandler<ES, "head">;
  get: HttpRequestHandler<ES, "get">;
  post: HttpRequestHandler<ES, "post">;
  put: HttpRequestHandler<ES, "put">;
  delete: HttpRequestHandler<ES, "delete">;
  patch: HttpRequestHandler<ES, "patch">;
  options: HttpRequestHandler<ES, "options">;
};

export type HttpRequestHandler<
  ES extends ApiEndpointsSchema,
  M extends Method,
  E extends ToApiEndpoints<ES> = ToApiEndpoints<ES>,
> = <
  Validators extends ToValidators<ES, RequestPath, M>,
  RequestPath extends keyof E & string,
  Params extends E[RequestPath][M]["params"],
  Body extends E[RequestPath][M]["body"],
  Responses extends ApiP<E, RequestPath, M, "responses"> extends AnyApiResponses
    ? ApiP<E, RequestPath, M, "responses">
    : Record<string, never>,
  ResBody extends 200 extends keyof Responses
    ? ApiResBody<Responses, 200> extends DefaultBodyType
      ? ApiResBody<Responses, 200>
      : never
    : never,
>(
  path: RequestPath,
  resolver: ResponseResolver<
    (Params extends PathParams<keyof Params>
      ? HttpRequestResolverExtras<Params>
      : Record<string, never>) &
      ExtraResolverArgs<ES, RequestPath, M>,
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
type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
export type HttpResponse<
  Responses extends AnyApiResponses,
  SC extends keyof Responses & StatusCode = 200 & StatusCode,
  ResponseBody extends ApiResBody<Responses, SC> & DefaultBodyType = ApiResBody<
    Responses,
    SC
  > &
    DefaultBodyType,
> = Overwrite<
  MswHttpResponse,
  {
    constructor: <NewSC extends keyof Responses & StatusCode>(
      body?: BodyInit | null,
      init?: HttpResponseInit<NewSC>,
    ) => HttpResponse<Responses, NewSC>;
    json: <NewSC extends keyof Responses & StatusCode = 200 & StatusCode>(
      body: ApiResBody<Responses, NewSC>,
      init?: HttpResponseInit<NewSC>,
    ) => StrictResponse<ResponseBody>;
  }
>;

type ExtraResolverArgs<
  ES extends ApiEndpointsSchema,
  Path extends keyof ToApiEndpoints<ES> & string,
  M extends Method,
> = {
  validate: ToValidators<ES, Path, M>;
};

export const newHttp = <
  BaseUrl extends UrlPrefixPattern,
  ES extends ApiEndpointsSchema,
>(
  baseUrl: BaseUrl,
  endpoints: ES,
): Http<BaseUrl, ES> => {
  const { req, res } = newValidator(endpoints);
  return new Proxy(http, {
    get(target, prop, receiver) {
      // o is the original method of the provided router
      const requestHandler = Reflect.get(target, prop, receiver);
      // if (prop === "all") {
      //   return requestHandler;
      // }
      return <
        // FIXME: Record<string, string> should be PathParams<keyof Params>
        Params extends Record<string, string> = Record<string, string>,
        // Params extends PathParams<keyof Params> = PathParams,
        RequestBodyType extends DefaultBodyType = DefaultBodyType,
        ResponseBodyType extends DefaultBodyType = undefined,
        RequestPath extends string = string,
      >(
        path: RequestPath,
        // modify後のresolverを想定した型
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
              // FIXME
              validate: validator as unknown as ToValidators<
                ES,
                RequestPath,
                Method
              >,
            });
          },
        });
        return requestHandler(path, resolver2, options);
      };
    },
  }) as Http<BaseUrl, ES>;
};
