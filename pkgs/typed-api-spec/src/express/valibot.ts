import { Method } from "../core";
import {
  RouterT,
  ToHandler as ToPureHandler,
  ToHandlers as ToPureHandlers,
  validatorMiddleware,
} from "./index";
import { Router } from "express";
import {
  newSSValidator,
  SSApiEndpoints,
  SSApiSpec,
  SSValidators,
  ToApiEndpoints,
} from "../ss";

/**
 * Convert SSApiSpec to Express Request Handler type.
 */
export type ToHandler<
  ZodE extends SSApiEndpoints,
  Path extends keyof ZodE & string,
  M extends Method,
> = ToPureHandler<ToApiEndpoints<ZodE>[Path][M], ToValidators<ZodE[Path][M]>>;

export type ToValidators<Spec extends SSApiSpec | undefined> =
  Spec extends SSApiSpec ? SSValidators<Spec, string> : Record<string, never>;

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
    [M in Method]: ToValidators<ZodE[Path][M]>;
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
 *   const r = res.locals.validate(req).query()
 *   if (!r.success) {
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
  const { req: reqValidator } = newSSValidator(pathMap);
  router.use(validatorMiddleware(reqValidator));
  return router;
};
