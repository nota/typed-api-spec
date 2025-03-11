import type FetchT from "./index.js";
import { SSApiEndpoints, ToApiEndpoints } from "../core/ss.js";
import { withValidation } from "./index.js";

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
      return (await withValidation(ft, await specLoader())) as Fetch;
    }
    return ft as Fetch;
  };
};
