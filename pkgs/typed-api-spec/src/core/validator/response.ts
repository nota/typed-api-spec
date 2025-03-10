import {
  AnyApiEndpoints,
  AnyApiSpec,
  AnyResponse,
  ApiSpecResponseKey,
  apiSpecResponseKeys,
  Method,
} from "../spec";
import { StatusCode } from "../hono-types";
import { Result } from "../../utils";
import {
  AnyValidator,
  checkValidatorsInput,
  ValidatorInputError,
} from "./validate";
import { AnySpecValidator } from "./request";
import { StandardSchemaV1 } from "@standard-schema/spec";

export const listDefinedResponseApiSpecKeys = <Response extends AnyResponse>(
  res: Response,
): ApiSpecResponseKey[] => {
  return apiSpecResponseKeys.filter((key) => res[key] !== undefined);
};

export type ResponseSpecValidatorGenerator = (
  input: ResponseSpecValidatorGeneratorRawInput<string, string, number>,
) => Result<AnyResponseSpecValidator, ValidatorInputError>;
export type ResponseValidatorGenerator = (
  spec: AnyApiSpec,
  input: ResponseSpecValidatorGeneratorInput<string, Method, StatusCode>,
  key: ApiSpecResponseKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any;
export const createResponseSpecValidatorGenerator = <E extends AnyApiEndpoints>(
  endpoints: E,
  resValidatorGenerator: ResponseValidatorGenerator,
) => {
  return (
    input: ResponseSpecValidatorGeneratorInput<string, Method, StatusCode>,
  ): Result<AnyResponseSpecValidator, ValidatorInputError> => {
    const { data: vInput, error } = checkValidatorsInput(endpoints, input);
    if (error) {
      return Result.error(error);
    }
    const validator: AnySpecValidator = {};
    const spec = endpoints[vInput.path][vInput.method]!;
    const response = spec?.responses?.[input.statusCode as StatusCode] ?? {};
    listDefinedResponseApiSpecKeys(response).forEach((key) => {
      validator[key] = () => resValidatorGenerator(spec, input, key);
    });
    return Result.data(validator);
  };
};

export type ResponseSpecValidator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BodyValidator extends AnyValidator | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HeadersValidator extends AnyValidator | undefined,
> = {
  body: BodyValidator;
  headers: HeadersValidator;
};
export type AnyResponseSpecValidator = Partial<
  ResponseSpecValidator<AnyValidator, AnyValidator>
>;
export const runResponseSpecValidator = (
  r: Result<AnyResponseSpecValidator, ValidatorInputError>,
) => {
  const newD = () =>
    ({ value: undefined }) as StandardSchemaV1.SuccessResult<undefined>;
  return {
    // TODO: スキーマが間違っていても、bodyのvalidatorがなぜか定義されていない
    preCheck: r.error,
    body: r.data?.body?.() ?? newD(),
    headers: r.data?.headers?.() ?? newD(),
  };
};

export type ResponseSpecValidatorGeneratorRawInput<
  Path extends string,
  M extends string,
  SC extends number,
> = {
  path: Path;
  method: M;
  statusCode: SC;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};
export type ResponseSpecValidatorGeneratorInput<
  Path extends string,
  M extends Method,
  SC extends StatusCode,
> = {
  path: Path;
  method: M;
  statusCode: SC;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};
