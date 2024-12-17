import type { ZodApiEndpoints } from "./index";

export const withZodValidation = async (spec: ZodApiEndpoints, ft = fetch) => {
  const { withValidation } = await import("../fetch/index.js");
  const { newZodValidator } = await import("./index.js");
  const v = newZodValidator(spec);
  return withValidation(ft, spec, v.req, v.res);
};
