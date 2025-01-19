import {
  BaseIssue,
  BaseSchema,
  InferIssue,
  InferOutput,
  SafeParseResult,
} from "valibot";
import * as v from "valibot";
import { Result } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyV = BaseSchema<any, any, any>;

export type InferOrUndefined<T> = T extends AnyV ? v.InferOutput<T> : undefined;

export const toResult = <
  T extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(
  res: SafeParseResult<T>,
): Result<InferOutput<T>, [InferIssue<T>, ...InferIssue<T>[]]> => {
  if (res.success) {
    return Result.data(res.output);
  } else {
    return Result.error(res.issues);
  }
};
