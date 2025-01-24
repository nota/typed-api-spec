import {
  ApiResBody,
  ApiResHeaders,
  ApiResponses,
  createValidator,
  Method,
  ResponseSpecValidator,
  ResponseSpecValidatorGeneratorRawInput,
  SpecValidator,
  SpecValidatorGeneratorRawInput,
  StatusCode,
  Validator,
  ValidatorInputError,
} from "../core";
import * as v from "valibot";
import {
  AnyV,
  toResult,
  ValibotAnyApiResponses,
  ValibotApiEndpoints,
  ValibotApiSpec,
} from "./index";
import { Result } from "../utils";

export type ValibotValidator<V extends AnyV | undefined> = V extends AnyV
  ? Validator<v.InferOutput<V>, [v.InferIssue<V>, ...v.InferIssue<V>[]]>
  : undefined;
export type ValibotValidators<
  AS extends ValibotApiSpec,
  // FIXME
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string,
> = SpecValidator<
  ValibotValidator<AS["params"]>,
  ValibotValidator<AS["query"]>,
  ValibotValidator<AS["body"]>,
  ValibotValidator<AS["headers"]>
>;

export type ToValibotValidators<
  E extends ValibotApiEndpoints,
  Path extends string,
  M extends string,
> = Path extends keyof E
  ? M extends keyof E[Path] & Method
    ? E[Path][M] extends ValibotApiSpec
      ? ValibotValidators<E[Path][M], string>
      : Record<string, never>
    : Record<string, never>
  : Record<string, never>;

export type ValibotResponseValidators<
  Body extends AnyV | undefined,
  Headers extends AnyV | undefined,
> = ResponseSpecValidator<ValibotValidator<Body>, ValibotValidator<Headers>>;

export type ToValibotResponseValidators<
  Responses extends ValibotAnyApiResponses | undefined,
  SC extends number,
> = ValibotResponseValidators<
  Responses extends ValibotAnyApiResponses
    ? SC extends keyof Responses
      ? ApiResBody<Responses, SC>
      : undefined
    : undefined,
  Responses extends ValibotAnyApiResponses
    ? SC extends keyof Responses
      ? ApiResHeaders<Responses, SC> extends AnyV
        ? ApiResHeaders<Responses, SC>
        : undefined
      : undefined
    : undefined
>;

type ValibotRequestValidatorsGenerator<E extends ValibotApiEndpoints> = <
  Path extends string,
  M extends string,
>(
  input: SpecValidatorGeneratorRawInput<Path, M>,
) => Result<ToValibotValidators<E, Path, M>, ValidatorInputError>;
type ValibotResponseValidatorsGenerator<E extends ValibotApiEndpoints> = <
  Path extends string,
  M extends string,
  SC extends number,
>(
  input: ResponseSpecValidatorGeneratorRawInput<Path, M, SC>,
) => Result<
  ToValibotResponseValidators<ApiResponses<E, Path, M>, SC>,
  ValidatorInputError
>;
/**
 * Create a new validator for the given endpoints.
 *
 * @param endpoints API endpoints
 */
export const newValibotValidator = <E extends ValibotApiEndpoints>(
  endpoints: E,
) => {
  return createValidator(
    endpoints,
    (spec: ValibotApiSpec, input, key) =>
      toResult(v.safeParse(spec[key]!, input[key])),
    (spec: ValibotApiSpec, input, key) => {
      const schema = spec["responses"][input.statusCode as StatusCode]?.[key];
      // FIXME: schemaがundefinedの場合の処理
      return toResult(v.safeParse(schema!, input[key]));
    },
  ) as {
    req: ValibotRequestValidatorsGenerator<E>;
    res: ValibotResponseValidatorsGenerator<E>;
  };
};
