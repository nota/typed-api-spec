import type FetchT from "../fetch/index.js";
import { SSApiEndpoints, ToApiEndpoints } from "../core/ss.js";

export const withZodValidation = async (spec: SSApiEndpoints, ft = fetch) => {
  const { withValidation } = await import("../fetch/index.js");
  // const { newSSValidator } = await import("../ss/index.js");
  // const v = newSSValidator(spec);
  return withValidation(ft, spec);
  // return withValidation(ft, spec, v.req, v.res);
};

export const newFetch = <E extends SSApiEndpoints = SSApiEndpoints>(
  specLoader: () => Promise<E>,
  validation: boolean,
  ft = fetch,
) => {
  return async <
    Origin extends string = "",
    E2 extends ToApiEndpoints<E> = ToApiEndpoints<E>,
    Fetch = FetchT<Origin, E2>,
  >(): Promise<Fetch> => {
    if (validation) {
      return (await withZodValidation(await specLoader(), ft)) as Fetch;
    }
    return ft as Fetch;
  };
};
