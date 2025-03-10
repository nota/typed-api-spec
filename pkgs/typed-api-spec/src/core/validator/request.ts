import {
  AnyApiEndpoints,
  AnyApiSpec,
  ApiSpecRequestKey,
  apiSpecRequestKeys,
  Method,
} from "../spec";
import { Result } from "../../utils";
import {
  AnyValidator,
  checkValidatorsInput,
  ValidatorInputError,
} from "./validate";
import { ParsedQs } from "qs";
import { StandardSchemaV1 } from "@standard-schema/spec";

export const listDefinedRequestApiSpecKeys = <Spec extends AnyApiSpec>(
  spec: Spec,
): ApiSpecRequestKey[] => {
  return apiSpecRequestKeys.filter((key) => spec[key] !== undefined);
};

export type SpecValidator<
  ParamsValidator extends AnyValidator | undefined,
  QueryValidator extends AnyValidator | undefined,
  BodyValidator extends AnyValidator | undefined,
  HeadersValidator extends AnyValidator | undefined,
> = {
  // FIXME: FilterNeverにしたい
  params: ParamsValidator;
  query: QueryValidator;
  body: BodyValidator;
  headers: HeadersValidator;
};
export type AnySpecValidator = Partial<
  SpecValidator<AnyValidator, AnyValidator, AnyValidator, AnyValidator>
>;
export type SpecValidatorMap = {
  [Path in string]: Partial<Record<Method, AnySpecValidator>>;
};

export type SpecValidatorGeneratorRawInput<
  Path extends string,
  Method extends string,
> = {
  path: Path;
  method: Method;
  params: Record<string, string | string[]>;
  query?: ParsedQs;
  body?: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
};
export type SpecValidatorGeneratorInput<
  Path extends string,
  M extends Method,
> = {
  path: Path;
  method: M;
  params: Record<string, string | string[]>;
  query?: ParsedQs;
  body?: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
};

export const runSpecValidator = (validators: AnySpecValidator | undefined) => {
  const newD = () =>
    ({ value: undefined }) as StandardSchemaV1.SuccessResult<undefined>;
  return {
    params: validators?.params?.() ?? newD(),
    query: validators?.query?.() ?? newD(),
    body: validators?.body?.() ?? newD(),
    headers: validators?.headers?.() ?? newD(),
  };
};

export type RequestSpecValidatorGenerator = (
  input: SpecValidatorGeneratorRawInput<string, string>,
) => Result<AnySpecValidator, ValidatorInputError>;
export type RequestValidatorGenerator = (
  spec: AnyApiSpec,
  input: SpecValidatorGeneratorInput<string, Method>,
  key: ApiSpecRequestKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any;
export const createRequestSpecValidatorGenerator = <E extends AnyApiEndpoints>(
  endpoints: E,
  specValidatorGenerator: RequestValidatorGenerator,
): RequestSpecValidatorGenerator => {
  return (
    input: SpecValidatorGeneratorRawInput<string, string>,
  ): Result<AnySpecValidator, ValidatorInputError> => {
    const { data: vInput, error } = checkValidatorsInput(endpoints, input);
    if (error) {
      return Result.error(error);
    }
    const validators: AnySpecValidator = {};
    const spec = endpoints[vInput.path][vInput.method]!;
    listDefinedRequestApiSpecKeys(spec).forEach((key) => {
      validators[key] = () => specValidatorGenerator(spec, vInput, key);
    });
    return Result.data(validators);
  };
};
