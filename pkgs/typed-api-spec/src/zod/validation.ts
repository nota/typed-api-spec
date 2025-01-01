import type { ToApiEndpoints, ZodApiEndpoints } from "./index";
import type FetchT from "../fetch/index.js";

export const withZodValidation = async (spec: ZodApiEndpoints, ft = fetch) => {
  const { withValidation } = await import("../fetch/index.js");
  const { newZodValidator } = await import("./index.js");
  const v = newZodValidator(spec);
  return withValidation(ft, spec, v.req, v.res);
};

export const newFetch = <Spec extends ZodApiEndpoints = ZodApiEndpoints>(
  specLoader: () => Promise<Spec>,
  validation: boolean,
  ft = fetch,
) => {
  return async <
    Origin extends string = "",
    Fetch = FetchT<Origin, ToApiEndpoints<Spec>>,
  >(): Promise<Fetch> => {
    if (validation) {
      return (await withZodValidation(await specLoader(), ft)) as Fetch;
    }
    return ft as Fetch;
  };
};
