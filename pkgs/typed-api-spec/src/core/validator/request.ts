import {
  AnyApiSpec,
  ApiSpecRequestKey,
  apiSpecRequestKeys,
  Method,
} from "../spec";
import { AnyValidator } from "./validate";
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

export const runSpecValidator = async (
  validators: AnySpecValidator,
  errorHandler: (
    reason: keyof AnySpecValidator | "preCheck",
    errors: Readonly<StandardSchemaV1.Issue[]>,
  ) => void,
) => {
  const params = await validators?.params?.();
  if (params?.issues) {
    errorHandler("params", params.issues);
  }
  const query = await validators?.query?.();
  if (query?.issues) {
    errorHandler("query", query.issues);
  }
  const body = await validators?.body?.();
  if (body?.issues) {
    errorHandler("body", body.issues);
  }
  const headers = await validators?.headers?.();
  if (headers?.issues) {
    errorHandler("headers", headers.issues);
  }
};
