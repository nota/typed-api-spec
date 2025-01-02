import { z } from "zod";
import { ToApiEndpoints, ZodApiEndpoints } from "@notainc/typed-api-spec/zod";

const JsonHeader = z.union([
  z.object({ "content-type": z.literal("application/json") }),
  z.object({ "Content-Type": z.literal("application/json") }),
]);
export const pathMap = {
  "/users": {
    get: {
      query: z.object({
        page: z.string(),
      }),
      responses: {
        200: { body: z.object({ userNames: z.string().array() }) },
        400: { body: z.object({ errorMessage: z.string() }) },
      },
    },
    post: {
      headers: JsonHeader,
      responses: {
        200: {
          headers: JsonHeader,
          body: z.object({ userId: z.string() }),
        },
        400: {
          headers: JsonHeader,
          body: z.object({ errorMessage: z.string() }),
        },
      },
      body: z.object({
        userName: z.string(),
      }),
    },
  },
  "/users/:userId": {
    get: {
      params: z.object({ userId: z.string() }),
      responses: {
        200: { body: z.object({ userName: z.string() }) },
        400: { body: z.object({ errorMessage: z.string() }) },
      },
    },
  },
} satisfies ZodApiEndpoints;
export type PathMap = ToApiEndpoints<typeof pathMap>;
