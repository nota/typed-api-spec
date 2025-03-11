import {
  AnyResponse,
  ApiResBody,
  ApiResHeaders,
  ApiResponses,
  BaseApiSpec,
  DefineApiResponses,
  DefineResponse,
  Method,
  StatusCode,
} from ".";
import {
  checkValidatorsInput,
  Validator,
  ValidatorInputError,
} from "./validator/validate";
import { Result } from "../utils";
import {
  AnySpecValidator,
  listDefinedRequestApiSpecKeys,
  SpecValidator,
  SpecValidatorGeneratorRawInput,
} from "./validator/request";
import {
  listDefinedResponseApiSpecKeys,
  ResponseSpecValidator,
  ResponseSpecValidatorGeneratorRawInput,
} from "./validator/response";
import { StandardSchemaV1 } from "@standard-schema/spec";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStandardSchemaV1 = StandardSchemaV1<any>;

export type SSValidator<V extends AnyStandardSchemaV1 | undefined> =
  V extends AnyStandardSchemaV1
    ? Validator<NonNullable<StandardSchemaV1.InferOutput<V>>>
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
  ? StandardSchemaV1.InferInput<T>
  : undefined;

// -- spec --
export type SSApiEndpoints = { [Path in string]: SSApiEndpoint };
export type SSApiEndpoint = Partial<Record<Method, SSApiSpec>>;
export type SSApiSpec<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string = string,
  Params extends AnyStandardSchemaV1 = AnyStandardSchemaV1,
  Query extends AnyStandardSchemaV1 = AnyStandardSchemaV1,
  Body extends AnyStandardSchemaV1 = AnyStandardSchemaV1,
  RequestHeaders extends AnyStandardSchemaV1 = AnyStandardSchemaV1,
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

/**
 * Create a new validator for the given endpoints.
 *
 * @param endpoints API endpoints
 */
export const newSSValidator = <E extends SSApiEndpoints>(endpoints: E) => {
  const req = <Path extends string, M extends string>(
    input: SpecValidatorGeneratorRawInput<Path, M>,
  ): Result<ToSSValidators<E, Path, M>, ValidatorInputError> => {
    const { data: vInput, error } = checkValidatorsInput(endpoints, input);
    if (error) {
      return Result.error(error);
    }
    const validators: AnySpecValidator = {};
    const spec = endpoints[vInput.path][vInput.method]!;
    listDefinedRequestApiSpecKeys(spec).forEach((key) => {
      validators[key] = async () => {
        let r = spec[key]!["~standard"].validate(input[key]);
        if (r instanceof Promise) r = await r;
        return r;
      };
    });
    return Result.data(validators as ToSSValidators<E, Path, M>);
  };
  const res = <Path extends string, M extends string, SC extends number>(
    input: ResponseSpecValidatorGeneratorRawInput<Path, M, SC>,
  ): Result<
    ToSSResponseValidators<ApiResponses<E, Path, M>, SC>,
    ValidatorInputError
  > => {
    const { data: vInput, error } = checkValidatorsInput(endpoints, input);
    if (error) {
      return Result.error(error);
    }
    const validator: AnySpecValidator = {};
    const spec = endpoints[vInput.path][vInput.method]!;
    const response =
      spec?.responses?.[input.statusCode as StatusCode] ?? ({} as AnyResponse);
    listDefinedResponseApiSpecKeys(response).forEach((key) => {
      validator[key] = async () => {
        const schema = spec["responses"][input.statusCode as StatusCode]?.[key];
        let r = schema!["~standard"].validate(input[key]);
        if (r instanceof Promise) r = await r;
        return r;
      };
    });
    return Result.data(
      validator as ToSSResponseValidators<ApiResponses<E, Path, M>, SC>,
    );
  };
  return { req, res };
};
