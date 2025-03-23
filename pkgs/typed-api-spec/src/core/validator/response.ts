import { AnyResponse, ApiSpecResponseKey, apiSpecResponseKeys } from "../spec";
import { AnyValidator } from "./validate";
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
export const runResponseSpecValidator = async (
  validators: AnyResponseSpecValidator,
  errorHandler: (
    reason: keyof AnyResponseSpecValidator | "preCheck",
    errors: Readonly<StandardSchemaV1.Issue[]>,
  ) => void,
) => {
  const body = await validators?.body?.();
  if (body?.issues) {
    errorHandler("body", body.issues);
  }
  const headers = await validators?.headers?.();
  if (headers?.issues) {
    errorHandler("headers", headers.issues);
  }
};

export type ResponseSpecValidatorGeneratorInput<
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
