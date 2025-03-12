import { AnyApiResponses, Method, StatusCode } from "../core";
import {
  ApiEndpointSchema,
  ApiEndpointsSchema,
  ApiSpecSchema,
} from "../core/schema";

const toFastifyResponse = <Responses extends AnyApiResponses>(
  responses: Responses,
): ToFastifyResponse<Responses> => {
  const ret = { ...responses };
  Object.keys(responses).forEach((key) => {
    const sc = key as keyof Responses as StatusCode;
    ret[sc] = responses[sc]!.body;
  });
  return ret as ToFastifyResponse<Responses>;
};

type ToFastifyResponse<Responses extends AnyApiResponses> = {
  [SC in keyof Responses & StatusCode]: NonNullable<Responses[SC]>["body"];
};

type FastifySchema<Spec extends ApiSpecSchema> = {
  querystring: Spec["query"];
  params: Spec["params"];
  body: Spec["body"];
  headers: Spec["headers"];
  response: ToFastifyResponse<Spec["responses"]>;
};
export const toSchema = <Spec extends ApiSpecSchema>(
  spec: Spec,
): FastifySchema<Spec> => {
  return {
    querystring: spec.query,
    params: spec.params,
    body: spec.body,
    headers: spec.headers,
    response: toFastifyResponse(spec.responses),
  };
};

type FastifyRoute<
  Spec extends ApiSpecSchema,
  Url extends string,
  M extends Method,
> = {
  method: M;
  url: Url;
  schema: FastifySchema<Spec>;
};
const specToRoute = <
  Spec extends ApiSpecSchema,
  Path extends string,
  M extends Method,
>(
  url: Path,
  method: M,
  spec: Spec,
): FastifyRoute<Spec, Path, M> => {
  return {
    method,
    url,
    schema: toSchema(spec),
  };
};
type EndpointFastifyRoute<
  Endpoint extends ApiEndpointSchema,
  Path extends string,
> = {
  [M in keyof Endpoint & Method]: FastifyRoute<
    NonNullable<Endpoint[M]>,
    Path,
    M
  >;
};
const endpointToRoute = <
  Endpoint extends ApiEndpointSchema,
  Path extends string,
>(
  path: Path,
  endpoint: Endpoint,
): EndpointFastifyRoute<Endpoint, Path> => {
  return Object.entries(endpoint).reduce(
    (acc, [method, spec]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc as any)[method] = specToRoute(path, method as Method, spec);
      return acc;
    },
    {} as EndpointFastifyRoute<Endpoint, Path>,
  );
};
type EndpointsFastifyRoute<Endpoints extends ApiEndpointsSchema> = {
  [Path in keyof Endpoints & string]: EndpointFastifyRoute<
    Endpoints[Path],
    Path
  >;
};
export const toRoutes = <ZodE extends ApiEndpointsSchema>(
  e: ZodE,
): EndpointsFastifyRoute<ZodE> => {
  return Object.entries(e).reduce((acc, [path, endpoint]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (acc as any)[path] = endpointToRoute(path, endpoint);
    return acc;
  }, {} as EndpointsFastifyRoute<ZodE>);
};
