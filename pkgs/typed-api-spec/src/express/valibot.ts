import {
  ToApiEndpoints,
  ValibotApiEndpoints,
  ValibotApiSpec,
  ValibotValidators,
} from "../valibot";
import { Method } from "../core";
import {
  RouterT,
  ToHandler as ToPureHandler,
  ToHandlers as ToPureHandlers,
  validatorMiddleware,
} from "./index";
import { Router } from "express";
import { newSSValidator } from "../ss";

/**
 * Convert ValibotApiSpec to Express Request Handler type.
 */
export type ToHandler<
  ZodE extends ValibotApiEndpoints,
  Path extends keyof ZodE & string,
  M extends Method,
> = ToPureHandler<ToApiEndpoints<ZodE>[Path][M], ToValidators<ZodE[Path][M]>>;

export type ToValidators<Spec extends ValibotApiSpec | undefined> =
  Spec extends ValibotApiSpec
    ? ValibotValidators<Spec, string>
    : Record<string, never>;

/**
 * Convert ValibotApiEndpoints to Express Request Handler type map.
 */
export type ToHandlers<
  ZodE extends ValibotApiEndpoints,
  E extends ToApiEndpoints<ZodE> = ToApiEndpoints<ZodE>,
  V extends ToValidatorsMap<ZodE> = ToValidatorsMap<ZodE>,
> = ToPureHandlers<E, V>;

export type ToValidatorsMap<ZodE extends ValibotApiEndpoints> = {
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
export const typed = <const Endpoints extends ValibotApiEndpoints>(
  pathMap: Endpoints,
  router: Router,
): RouterT<ToApiEndpoints<Endpoints>, ToValidatorsMap<Endpoints>> => {
  const { req: reqValidator } = newSSValidator(pathMap);
  router.use(validatorMiddleware(reqValidator));
  return router;
};
