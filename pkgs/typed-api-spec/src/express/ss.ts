import { Method } from "../core";
import {
  newSSValidator,
  SSApiEndpoints,
  ToApiEndpoints,
  ToSSValidators,
} from "../ss";
import {
  RouterT,
  ToHandler as ToPureHandler,
  ToHandlers as ToPureHandlers,
  validatorMiddleware,
} from "./index";
import { Router } from "express";

/**
 * Convert ZodApiSpec to Express Request Handler type.
 */
export type ToHandler<
  ZodE extends SSApiEndpoints,
  Path extends keyof ZodE & string,
  M extends Method,
> = ToPureHandler<ToApiEndpoints<ZodE>[Path][M], ToSSValidators<ZodE, Path, M>>;

/**
 * Convert SSApiEndpoints to Express Request Handler type map.
 */
export type ToHandlers<
  ZodE extends SSApiEndpoints,
  E extends ToApiEndpoints<ZodE> = ToApiEndpoints<ZodE>,
  V extends ToValidatorsMap<ZodE> = ToValidatorsMap<ZodE>,
> = ToPureHandlers<E, V>;

export type ToValidatorsMap<ZodE extends SSApiEndpoints> = {
  [Path in keyof ZodE & string]: {
    [M in Method]: ToSSValidators<ZodE, Path, M>;
  };
};

/**
 * Set validator and add more strict type information to router.
 *
 * @param pathMap API endpoints
 * @param router Express Router
 *
 * @example
 * ```
 * const router = typed(pathMap, express.Router())
 * router.get('/path', (req, res) => {
 *   const {data, error} = res.locals.validate(req).query()
 *   if (error) {
 *     return res.status(400).json({ message: 'Invalid query' })
 *   }
 *   return res.status(200).json({ message: 'success', value: r.data.value })
 * })
 * ```
 */
export const typed = <const Endpoints extends SSApiEndpoints>(
  pathMap: Endpoints,
  router: Router,
): RouterT<ToApiEndpoints<Endpoints>, ToValidatorsMap<Endpoints>> => {
  // const { req: reqValidator } = newSSValidator(pathMap);
  // router.use(validatorMiddleware(reqValidator));
  // const { req: reqValidator } = newSSValidator(pathMap);
  router.use(validatorMiddleware(pathMap));
  return router;
};
