// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Equal, Expect } from "../core/type-test";
import { z } from "zod";
import { ApiP } from "../core";
import {
  SSApiEndpoints,
  SSResponseValidators,
  SSValidators,
  ToSSResponseValidators,
  ToSSValidators,
} from "../ss";

const SSResponse = z.object({ a: z.string() });
const SSEndpoints = {
  "/": {
    get: {
      query: z.object({ q: z.string() }),
      responses: {
        200: { body: SSResponse },
      },
    },
  },
} satisfies SSApiEndpoints;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ToSSValidatorsTestCases = [
  Expect<
    Equal<
      ToSSValidators<typeof SSEndpoints, "/", "get">,
      SSValidators<(typeof SSEndpoints)["/"]["get"], string>
    >
  >,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SSResponseValidatorsTestCases = [
  Expect<
    Equal<
      SSResponseValidators<undefined, undefined>,
      { body: undefined; headers: undefined }
    >
  >,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ToSSResponseValidatorsTestCases = [
  Expect<
    Equal<
      ToSSResponseValidators<
        ApiP<typeof SSEndpoints, "/", "get", "responses">,
        200
      >,
      SSResponseValidators<typeof SSResponse, undefined>
    >
  >,
];
