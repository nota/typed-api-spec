import { z } from "zod";
import { ClientResponse, StatusCode } from "./hono-types";
import { ParseUrlParams } from "./url";

export type ApiResponses = Partial<Record<StatusCode, z.ZodTypeAny>>;
export type ApiResSchema<
  AResponses extends ApiResponses,
  SC extends keyof AResponses & StatusCode,
> = AResponses[SC] extends z.ZodTypeAny ? AResponses[SC] : never;
export type ApiQuerySchema<
  E extends ApiEndpoints,
  Path extends keyof E & string,
  M extends Method,
> = E[Path] extends undefined
  ? never
  : E[Path][M] extends undefined
    ? never
    : NonNullable<E[Path][M]>["query"] extends undefined
      ? never
      : NonNullable<NonNullable<E[Path][M]>["query"]>;
export type ApiBodySchema<
  E extends ApiEndpoints,
  Path extends keyof E & string,
  M extends Method,
> = E[Path] extends undefined
  ? undefined
  : E[Path][M] extends undefined
    ? undefined
    : NonNullable<E[Path][M]>["body"] extends undefined
      ? undefined
      : NonNullable<NonNullable<E[Path][M]>["body"]>;

export type InferOrUndefined<T> = T extends z.ZodTypeAny
  ? z.infer<T>
  : undefined;

type ZodTypeWithKey<Key extends string> = z.ZodType<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<Key, any>,
  z.ZodTypeDef,
  Record<Key, string>
>;
export interface ApiSpec<
  ParamKeys extends string = string,
  Params extends ZodTypeWithKey<NoInfer<ParamKeys>> = ZodTypeWithKey<
    NoInfer<ParamKeys>
  >,
  Query extends z.ZodTypeAny = z.ZodTypeAny,
  Body extends z.ZodTypeAny = z.ZodTypeAny,
  Response extends ApiResponses = Partial<Record<StatusCode, z.ZodTypeAny>>,
> {
  query?: Query;
  params?: Params;
  body?: Body;
  res: Response;
}

export const Method = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
] as const;
export type Method = (typeof Method)[number];
export type ApiEndpoints = {
  [K in string]: Partial<Record<Method, ApiSpec<ParseUrlParams<K>>>>;
};

type ApiClientResponses<AResponses extends ApiResponses> = {
  [SC in keyof AResponses & StatusCode]: ClientResponse<
    z.infer<ApiResSchema<AResponses, SC>>,
    SC,
    "json"
  >;
};
export type MergeApiResponses<AR extends ApiResponses> =
  ApiClientResponses<AR>[keyof ApiClientResponses<AR>];