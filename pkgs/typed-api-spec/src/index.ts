export * from "./core/index.js";
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
} from "./express/index.js";

export {
  toSchema as toFastifySchema,
  toRoutes as toFastifyRoutes,
} from "./fastify/index.js";

export type { FetchT, RequestInitT } from "./fetch/index.js";

export type {
  JSONT,
  JSON$stringifyT,
  TypedString,
  JsonStringifyResult,
  Jsonify,
  JsonifyObject,
} from "./json/index.js";
