import {
  DefaultBodyType,
  HttpHandler,
  HttpResponseResolver,
  PathParams,
  RequestHandlerOptions,
  HttpResponse as MswHttpResponse,
  StrictResponse,
} from "msw";
import {
  AnyApiResponses,
  ApiEndpoints,
  ApiP,
  ApiResBody,
  Method,
} from "../core";
import { StatusCode } from "../../dist";

export type Http<E extends ApiEndpoints> = {
  all: HttpRequestHandler<E, Method>;
  head: HttpRequestHandler<E, "head">;
  get: HttpRequestHandler<E, "get">;
  post: HttpRequestHandler<E, "post">;
  put: HttpRequestHandler<E, "put">;
  delete: HttpRequestHandler<E, "delete">;
  patch: HttpRequestHandler<E, "patch">;
  options: HttpRequestHandler<E, "options">;
};

export type HttpRequestHandler<E extends ApiEndpoints, M extends Method> = <
  RequestPath extends keyof E & string,
  Method extends keyof E[RequestPath] & string,
  Params extends ApiP<E, RequestPath, Method, "params">,
  Body extends ApiP<E, RequestPath, Method, "body">,
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
  resolver: HttpResponseResolver<
    Params extends PathParams<keyof Params> ? Params : Record<string, never>,
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
