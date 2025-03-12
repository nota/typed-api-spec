// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Equal, Expect } from "./type-test";
import { z } from "zod";
import {
  ApiP,
  ResponseValidators,
  ToSSResponseValidators,
  ToValidators,
  Validators,
} from ".";
import { SSApiEndpoints } from "./ss";

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
      ToValidators<typeof SSEndpoints, "/", "get">,
      Validators<(typeof SSEndpoints)["/"]["get"], string>
    >
  >,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SSResponseValidatorsTestCases = [
  Expect<
    Equal<
      ResponseValidators<undefined, undefined>,
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
      ResponseValidators<typeof SSResponse, undefined>
    >
  >,
];
