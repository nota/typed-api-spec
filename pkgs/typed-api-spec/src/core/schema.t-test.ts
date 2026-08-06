import { Equal, Expect } from "./type-test";
import { z } from "zod";
import {
  ApiP,
  ResponseValidators,
  ToSSResponseValidators,
  ToValidators,
  Validators,
} from ".";
import { ApiEndpointsSchema } from "./schema";

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
} satisfies ApiEndpointsSchema;

type ToSSValidatorsTestCases = [
  Expect<
    Equal<
      ToValidators<typeof SSEndpoints, "/", "get">,
      Validators<(typeof SSEndpoints)["/"]["get"], string>
    >
  >,
];

type SSResponseValidatorsTestCases = [
  Expect<
    Equal<
      ResponseValidators<undefined, undefined>,
      { body: undefined; headers: undefined }
    >
  >,
];

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
