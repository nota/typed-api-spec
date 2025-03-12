import { Result } from "../../utils";
import {
  AnyApiEndpoint,
  AnyApiEndpoints,
  AnyResponse,
  ApiResHeaders,
  ApiResBody,
  ApiResponses,
  isMethod,
  Method,
  MethodInvalidError,
  newMethodInvalidError,
} from "../spec";
import { ApiResponsesSchema, ApiSpecSchema } from "../schema";
import { ApiEndpointsSchema } from "../schema";
import {
  AnySpecValidator,
  listDefinedRequestApiSpecKeys,
  SpecValidator,
  SpecValidatorGeneratorInput,
  SpecValidatorGeneratorRawInput,
} from "./request";
import type { StandardSchemaV1 as SS } from "@standard-schema/spec";
import {
  listDefinedResponseApiSpecKeys,
  ResponseSpecValidator,
  ResponseSpecValidatorGeneratorRawInput,
} from "./response";
import { StatusCode } from "../hono-types";
export type SSResult<Data> = SS.Result<Data> | Promise<SS.Result<Data>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStandardSchemaV1 = SS<any>;

// export type Validator<Data> = () => SSResult<Data>;
export type Validator<V extends AnyStandardSchemaV1 | undefined> =
  V extends AnyStandardSchemaV1
    ? () => SSResult<NonNullable<SS.InferOutput<V>>>
    : undefined;

export type Validators<
  AS extends ApiSpecSchema,
  // FIXME
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string,
> = SpecValidator<
  Validator<AS["params"]>,
  Validator<AS["query"]>,
  Validator<AS["body"]>,
  Validator<AS["headers"]>
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyValidator = Validator<any>;

export type ResponseValidators<
  Body extends SS | undefined,
  Headers extends SS | undefined,
> = ResponseSpecValidator<Validator<Body>, Validator<Headers>>;
export type ToSSResponseValidators<
  Responses extends ApiResponsesSchema | undefined,
  SC extends number,
> = ResponseValidators<
  Responses extends ApiResponsesSchema
    ? SC extends keyof Responses
      ? ApiResBody<Responses, SC>
      : undefined
    : undefined,
  Responses extends ApiResponsesSchema
    ? SC extends keyof Responses
      ? ApiResHeaders<Responses, SC> extends SS
        ? ApiResHeaders<Responses, SC>
        : undefined
      : undefined
    : undefined
>;

export type ToValidators<
  E extends ApiEndpointsSchema,
  Path extends string,
  M extends string,
> = Path extends keyof E
  ? M extends keyof E[Path] & Method
    ? E[Path][M] extends ApiSpecSchema
      ? Validators<E[Path][M], string>
      : Record<string, never>
    : Record<string, never>
  : Record<string, never>;

export const checkValidatorsInput = <
  E extends AnyApiEndpoints,
  Path extends keyof E & string,
  M extends keyof E[Path] & Method,
>(
  endpoints: E,
  input: { path: string; method: string },
): Result<SpecValidatorGeneratorInput<Path, M>, ValidatorInputError> => {
  const method = input.method;
  if (!isMethod(method)) {
    return Result.error(newMethodInvalidError(method));
  }
  const { error: pathE } = validatePath(endpoints, input.path);
  if (pathE) {
    return Result.error(pathE);
  }
  const { error: methodE } = validateMethod(endpoints[input.path], method);
  if (methodE) {
    return Result.error(methodE);
  }
  return Result.data(input as SpecValidatorGeneratorInput<Path, M>);
};

export const validatePath = <E extends AnyApiEndpoints, Path extends string>(
  endpoints: E,
  path: Path,
): Result<keyof E & Path, ValidatorInputPathNotFoundError> => {
  if (!(path in endpoints)) {
    return Result.error(newValidatorPathNotFoundError(path));
  }
  return Result.data(path as keyof E & Path);
};

export const validateMethod = <
  Endpoint extends AnyApiEndpoint,
  M extends string,
>(
  endpoint: Endpoint,
  method: M & Method,
): Result<keyof Endpoint & M, ValidatorInputMethodNotFoundError> => {
  return endpoint[method] === undefined
    ? Result.error(newValidatorMethodNotFoundError(method))
    : Result.data(method);
};

export type ValidatorInputError =
  | MethodInvalidError
  | ValidatorInputMethodNotFoundError
  | ValidatorInputPathNotFoundError;

export const newValidatorMethodNotFoundError = (method: string) => ({
  target: "method" as const,
  actual: method,
  message: `method does not exist in endpoint` as const,
});
type ValidatorInputMethodNotFoundError = ReturnType<
  typeof newValidatorMethodNotFoundError
>;
export const newValidatorPathNotFoundError = (path: string) => ({
  target: "path" as const,
  actual: path,
  message: `path does not exist in endpoints` as const,
});
type ValidatorInputPathNotFoundError = ReturnType<
  typeof newValidatorPathNotFoundError
>;

/**
 * Create a new validator for the given endpoints.
 *
 * @param endpoints API endpoints
 */
export const newValidator = <E extends ApiEndpointsSchema>(endpoints: E) => {
  const req = <Path extends string, M extends string>(
    input: SpecValidatorGeneratorRawInput<Path, M>,
  ): Result<ToValidators<E, Path, M>, ValidatorInputError> => {
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
    return Result.data(validators as ToValidators<E, Path, M>);
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
