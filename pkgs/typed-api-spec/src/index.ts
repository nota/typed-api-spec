export * from "./core";
export {
  Handler as ExpressHandler,
  ToHandler as ToExpressHandler,
  ToHandlers as ToExpressHandlers,
  ExpressResponse,
  ValidateLocals as ExpressValidateLocals,
  RouterT as ExpressRouterT,
  validatorMiddleware as expressValidatorMiddleware,
  AsyncRequestHandler as ExpressAsyncRequestHandler,
  wrap as expressWrap,
  asAsync as expressAsAsync,
  typed as expressTyped,
} from "./express";

export {
  toSchema as toFastifySchema,
  toRoutes as toFastifyRoutes,
} from "./fastify";

import FetchT, { RequestInitT } from "./fetch";
export { FetchT, RequestInitT };

import JSONT, { JSON$stringifyT } from "./json";
export { JSONT, JSON$stringifyT };

export {
  newHttp as newMswHttp,
  Http as MswHttp,
  HttpRequestHandler as MswHttpRequestHandler,
  HttpRequestResolverExtras as MswHttpRequestResolverExtras,
} from "./msw";
