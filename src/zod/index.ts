import { SafeParseReturnType, z, ZodError, ZodType } from "zod";
import {
  ApiP,
  ApiResBody,
  ApiResHeaders,
  ApiResponses,
  BaseApiSpec,
  DefineApiResponses,
  DefineResponse,
  Method,
  StatusCode,
} from "../core";
import {
  createValidator,
  Validator,
  ValidatorInputError,
} from "../core/validator/validate";
import { Result } from "../utils";
import { Validators, ValidatorsRawInput } from "../core/validator/request";
import {
  ResponseValidators,
  ResponseValidatorsInput,
  ResponseValidatorsRawInput,
} from "../core/validator/response";

export const anyZ = <T>() => z.any() as ZodType<T>;
export type ZodValidator<V extends z.ZodTypeAny | undefined> =
  V extends z.ZodTypeAny
    ? Validator<
        NonNullable<ReturnType<V["safeParse"]>["data"]>,
        NonNullable<ReturnType<V["safeParse"]>["error"]>
      >
    : undefined;
export type ZodValidators<
  AS extends ZodApiSpec,
  // FIXME
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string,
> = Validators<
  ZodValidator<AS["params"]>,
  ZodValidator<AS["query"]>,
  ZodValidator<AS["body"]>,
  ZodValidator<AS["headers"]>
>;
export type ZodResponseValidators<
  Body extends z.ZodTypeAny | undefined,
  Headers extends z.ZodTypeAny | undefined,
> = ResponseValidators<ZodValidator<Body>, ZodValidator<Headers>>;
// export type ToZodResponseValidators<
//   E extends ZodApiEndpoints,
//   Path extends string,
//   M extends string,
//   SC extends number,
//   Responses extends Path extends keyof E
//     ? M extends keyof E[Path] & Method
//       ? E[Path][M] extends ZodApiSpec
//         ? ApiP<E, Path, M, "responses">
//         : undefined
//       : undefined
//     : undefined = Path extends keyof E
//     ? M extends keyof E[Path] & Method
//       ? E[Path][M] extends ZodApiSpec
//         ? ApiP<E, Path, M, "responses">
//         : undefined
//       : undefined
//     : undefined,
//   Body extends Responses extends ZodAnyApiResponses
//     ? SC extends keyof Responses
//       ? ApiResBody<Responses, SC>
//       : undefined
//     : undefined = Responses extends ZodAnyApiResponses
//     ? SC extends keyof Responses
//       ? ApiResBody<Responses, SC>
//       : undefined
//     : undefined,
//   Headers extends Responses extends ZodAnyApiResponses
//     ? SC extends keyof Responses & StatusCode
//       ? ApiResHeaders<Responses, SC>
//       : undefined
//     : undefined = Responses extends ZodAnyApiResponses
//     ? SC extends keyof Responses & StatusCode
//       ? ApiResHeaders<Responses, SC>
//       : undefined
//     : undefined,
// > = ZodResponseValidators<Body, Headers>;
export type ToZodResponseValidators<
  Responses extends ZodAnyApiResponses | undefined,
  SC extends number,
> = ZodResponseValidators<
  Responses extends ZodAnyApiResponses
    ? SC extends keyof Responses
      ? ApiResBody<Responses, SC>
      : undefined
    : undefined,
  Responses extends ZodAnyApiResponses
    ? SC extends keyof Responses
      ? ApiResHeaders<Responses, SC> extends z.ZodTypeAny
        ? ApiResHeaders<Responses, SC>
        : undefined
      : undefined
    : undefined
>;

export type ToZodValidators<
  E extends ZodApiEndpoints,
  Path extends string,
  M extends string,
  // Spec extends ZodApiSpec | undefined,
> = Path extends keyof E
  ? M extends keyof E[Path] & Method
    ? E[Path][M] extends ZodApiSpec
      ? ZodValidators<E[Path][M], string>
      : Record<string, never>
    : Record<string, never>
  : Record<string, never>;
// export type ToZodValidators<Spec extends ZodApiSpec | undefined> =
//   Spec extends ZodApiSpec ? ZodValidators<Spec, string> : Record<string, never>;

export type ZodRequestValidator = <
  E extends ZodApiEndpoints,
  Path extends string,
  M extends string,
>(
  input: ValidatorsRawInput<Path, M>,
) => Result<ToZodValidators<E, Path, M>, ValidatorInputError>;

export type ZodResponseValidator = <
  E extends ZodApiEndpoints,
  Path extends keyof E & string,
  M extends keyof E[Path] & Method,
  Responses extends ApiP<ToApiEndpoints<E>, Path, M, "responses">,
  SC extends keyof Responses & StatusCode,
  Body extends Responses extends ZodAnyApiResponses
    ? ApiResBody<Responses, SC>
    : undefined,
  Headers extends Responses extends ZodAnyApiResponses
    ? ApiResHeaders<Responses, SC>
    : undefined,
  // SC extends keyof ToApiResponses<> & StatusCode,
>(
  input: ResponseValidatorsInput<Path, M, SC>,
) => Result<ZodResponseValidators<Body, Headers>, ValidatorInputError>;

type ZodTypeWithKey<Key extends string> = z.ZodType<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<Key, any>,
  z.ZodTypeDef,
  Record<Key, string>
>;
export type InferOrUndefined<T> = T extends z.ZodTypeAny
  ? z.infer<T>
  : undefined;

// -- spec --
export type ZodApiEndpoints = { [Path in string]: ZodApiEndpoint };
export type ZodApiEndpoint = Partial<Record<Method, ZodApiSpec>>;
export type ZodApiSpec<
  ParamKeys extends string = string,
  Params extends ZodTypeWithKey<NoInfer<ParamKeys>> = ZodTypeWithKey<
    NoInfer<ParamKeys>
  >,
  Query extends z.ZodTypeAny = z.ZodTypeAny,
  Body extends z.ZodTypeAny = z.ZodTypeAny,
  RequestHeaders extends z.ZodTypeAny = z.ZodTypeAny,
  Responses extends ZodAnyApiResponses = ZodAnyApiResponses,
> = BaseApiSpec<Params, Query, Body, RequestHeaders, Responses>;
type ZodAnyApiResponse = DefineResponse<z.ZodTypeAny, z.ZodTypeAny>;
export type ZodAnyApiResponses = DefineApiResponses<ZodAnyApiResponse>;

// -- converter --
export type ToApiEndpoints<E extends ZodApiEndpoints> = {
  [Path in keyof E & string]: ToApiEndpoint<E, Path>;
};
export type ToApiEndpoint<E extends ZodApiEndpoints, Path extends keyof E> = {
  [M in keyof E[Path] & Method]: ToApiSpec<NonNullable<E[Path][M]>>;
};
export type ToApiSpec<ZAS extends ZodApiSpec> = {
  query: InferOrUndefined<ZAS["query"]>;
  params: InferOrUndefined<ZAS["params"]>;
  body: InferOrUndefined<ZAS["body"]>;
  headers: InferOrUndefined<ZAS["headers"]>;
  responses: ToApiResponses<ZAS["responses"]>;
};
export type ToApiResponses<AR extends ZodAnyApiResponses> = {
  [SC in keyof AR & StatusCode]: {
    body: InferOrUndefined<NonNullable<AR[SC]>["body"]>;
    headers: InferOrUndefined<NonNullable<AR[SC]>["headers"]>;
  };
};

/**
 * Create a new validator for the given endpoints.
 *
 * @param endpoints API endpoints
 */
export const newZodValidator = <E extends ZodApiEndpoints>(endpoints: E) => {
  const { req, res } = createValidator(
    endpoints,
    (spec: ZodApiSpec, input, key) =>
      toResult(spec[key]!.safeParse(input[key])),
    (spec: ZodApiSpec, input, key) => {
      const schema = spec["responses"][input.statusCode as StatusCode]?.[key];
      // FIXME: schemaがundefinedの場合の処理
      return toResult(schema!.safeParse(input[key]));
    },
  );
  return {
    req: req as <Path extends string, M extends string>(
      input: ValidatorsRawInput<Path, M>,
    ) => Result<ToZodValidators<E, Path, M>, ValidatorInputError>,
    res: res as <Path extends string, M extends string, SC extends number>(
      input: ResponseValidatorsRawInput<Path, M, SC>,
    ) => Result<
      ToZodResponseValidators<ApiResponses<E, Path, M>, SC>,
      ValidatorInputError
    >,
  };
};

const toResult = <T, U>(
  res: SafeParseReturnType<U, T>,
): Result<T, ZodError<U>> => {
  if (res.success) {
    return Result.data(res.data);
  } else {
    return Result.error(res.error);
  }
};
