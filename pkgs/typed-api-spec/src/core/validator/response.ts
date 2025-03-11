import {
  AnyResponse,
  ApiSpecResponseKey,
  apiSpecResponseKeys,
  Method,
} from "../spec";
import { StatusCode } from "../hono-types";
import { Result } from "../../utils";
import { AnyValidator, ValidatorInputError } from "./validate";
import { StandardSchemaV1 } from "@standard-schema/spec";

export const listDefinedResponseApiSpecKeys = <Response extends AnyResponse>(
  res: Response,
): ApiSpecResponseKey[] => {
  return apiSpecResponseKeys.filter((key) => res[key] !== undefined);
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
