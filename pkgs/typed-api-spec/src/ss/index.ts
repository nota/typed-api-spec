import {
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
import {
  SpecValidator,
  SpecValidatorGeneratorRawInput,
} from "../core/validator/request";
import {
  ResponseSpecValidator,
  ResponseSpecValidatorGeneratorRawInput,
} from "../core/validator/response";
import { StandardSchemaV1 } from "@standard-schema/spec";

export type SSValidator<V extends StandardSchemaV1 | undefined> =
  V extends StandardSchemaV1
    ? Validator<
        NonNullable<
          StandardSchemaV1.SuccessResult<StandardSchemaV1.InferOutput<V>>
        >,
        StandardSchemaV1.Issue[]
      >
    : undefined;
export type SSValidators<
  AS extends SSApiSpec,
  // FIXME
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string,
> = SpecValidator<
  SSValidator<AS["params"]>,
  SSValidator<AS["query"]>,
  SSValidator<AS["body"]>,
  SSValidator<AS["headers"]>
>;
export type SSResponseValidators<
  Body extends StandardSchemaV1 | undefined,
  Headers extends StandardSchemaV1 | undefined,
> = ResponseSpecValidator<SSValidator<Body>, SSValidator<Headers>>;
export type ToSSResponseValidators<
  Responses extends SSAnyApiResponses | undefined,
  SC extends number,
> = SSResponseValidators<
  Responses extends SSAnyApiResponses
    ? SC extends keyof Responses
      ? ApiResBody<Responses, SC>
      : undefined
    : undefined,
  Responses extends SSAnyApiResponses
    ? SC extends keyof Responses
      ? ApiResHeaders<Responses, SC> extends StandardSchemaV1
        ? ApiResHeaders<Responses, SC>
        : undefined
      : undefined
    : undefined
>;

export type ToSSValidators<
  E extends SSApiEndpoints,
  Path extends string,
  M extends string,
> = Path extends keyof E
  ? M extends keyof E[Path] & Method
    ? E[Path][M] extends SSApiSpec
      ? SSValidators<E[Path][M], string>
      : Record<string, never>
    : Record<string, never>
  : Record<string, never>;

export type InferOrUndefined<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T>
  : undefined;

// -- spec --
export type SSApiEndpoints = { [Path in string]: SSApiEndpoint };
export type SSApiEndpoint = Partial<Record<Method, SSApiSpec>>;
export type SSApiSpec<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string = string,
  Params extends StandardSchemaV1 = StandardSchemaV1,
  Query extends StandardSchemaV1 = StandardSchemaV1,
  Body extends StandardSchemaV1 = StandardSchemaV1,
  RequestHeaders extends StandardSchemaV1 = StandardSchemaV1,
  Responses extends SSAnyApiResponses = SSAnyApiResponses,
> = BaseApiSpec<Params, Query, Body, RequestHeaders, Responses>;
export type SSAnyApiResponse = DefineResponse<
  StandardSchemaV1,
  StandardSchemaV1
>;
export type SSAnyApiResponses = DefineApiResponses<SSAnyApiResponse>;

// -- converter --
export type ToApiEndpoints<E extends SSApiEndpoints> = {
  [Path in keyof E & string]: ToApiEndpoint<E, Path>;
};
export type ToApiEndpoint<E extends SSApiEndpoints, Path extends keyof E> = {
  [M in keyof E[Path] & Method]: ToApiSpec<NonNullable<E[Path][M]>>;
};
export type ToApiSpec<ZAS extends SSApiSpec> = {
  query: InferOrUndefined<ZAS["query"]>;
  params: InferOrUndefined<ZAS["params"]>;
  body: InferOrUndefined<ZAS["body"]>;
  headers: InferOrUndefined<ZAS["headers"]>;
  responses: ToApiResponses<ZAS["responses"]>;
};
export type ToApiResponses<AR extends SSAnyApiResponses> = {
  [SC in keyof AR & StatusCode]: {
    body: InferOrUndefined<NonNullable<AR[SC]>["body"]>;
    headers: InferOrUndefined<NonNullable<AR[SC]>["headers"]>;
  };
};

type SSRequestValidatorsGenerator<E extends SSApiEndpoints> = <
  Path extends string,
  M extends string,
>(
  input: SpecValidatorGeneratorRawInput<Path, M>,
) => Result<ToSSValidators<E, Path, M>, ValidatorInputError>;
type SSResponseValidatorsGenerator<E extends SSApiEndpoints> = <
  Path extends string,
  M extends string,
  SC extends number,
>(
  input: ResponseSpecValidatorGeneratorRawInput<Path, M, SC>,
) => Result<
  ToSSResponseValidators<ApiResponses<E, Path, M>, SC>,
  ValidatorInputError
>;

/**
 * Create a new validator for the given endpoints.
 *
 * @param endpoints API endpoints
 */
export const newSSValidator = <E extends SSApiEndpoints>(endpoints: E) => {
  return createValidator(
    endpoints,
    async (spec: SSApiSpec, input, key) => {
      let r = spec[key]!["~standard"].validate(input[key]);
      if (r instanceof Promise) r = await r;
      return toResult(r);
    },
    async (spec: SSApiSpec, input, key) => {
      const schema = spec["responses"][input.statusCode as StatusCode]?.[key];
      let r = schema!["~standard"].validate(input[key]);
      if (r instanceof Promise) r = await r;
      return toResult(r);
    },
  ) as {
    req: SSRequestValidatorsGenerator<E>;
    res: SSResponseValidatorsGenerator<E>;
  };
};

const toResult = <T>(
  res: StandardSchemaV1.Result<T>,
): Result<T, ReadonlyArray<StandardSchemaV1.Issue>> => {
  if (res.issues) {
    return Result.error(res.issues);
  } else {
    return Result.data(res.value);
  }
};
