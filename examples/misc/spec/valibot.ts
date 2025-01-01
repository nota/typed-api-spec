import * as v from "valibot";
import {
  ToApiEndpoints,
  ValibotApiEndpoints,
} from "@notainc/typed-api-spec/valibot";

const JsonHeader = v.object({
  "Content-Type": v.literal("application/json"),
});
export const pathMap = {
  "/users": {
    get: {
      query: v.object({
        page: v.string(),
      }),
      responses: {
        200: { body: v.object({ userNames: v.array(v.string()) }) },
        400: { body: v.object({ errorMessage: v.string() }) },
      },
    },
    post: {
      headers: JsonHeader,
      body: v.object({
        userName: v.string(),
      }),
      responses: {
        200: {
          headers: JsonHeader,
          body: v.object({ userId: v.string() }),
        },
        400: {
          headers: JsonHeader,
          body: v.object({ errorMessage: v.string() }),
        },
      },
    },
  },
  "/users/:userId": {
    get: {
      params: v.object({ userId: v.string() }),
      responses: {
        200: { body: v.object({ userName: v.string() }) },
        400: { body: v.object({ errorMessage: v.string() }) },
      },
    },
  },
} satisfies ValibotApiEndpoints;
export type PathMap = ToApiEndpoints<typeof pathMap>;
