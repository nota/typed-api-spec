import { ZodApiEndpoints } from "@notainc/typed-api-spec";
import z from "zod";
import { ToApiEndpoints } from "@notainc/typed-api-spec/zod";

// See https://docs.github.com/ja/rest/repos/repos?apiVersion=2022-11-28#get-all-repository-topics
export const ZodSpec = {
  "/repos/:owner/:repo/topics": {
    get: {
      responses: {
        200: { body: z.object({ names: z.string().array() }) },
        400: {
          body: z.object({
            message: z.string(),
            errors: z.string(),
            documentation_url: z.string(),
            status: z.number(),
          }),
        },
      },
    },
  },
} satisfies ZodApiEndpoints;
export type Spec = ToApiEndpoints<typeof ZodSpec>;

// See https://docs.github.com/ja/rest/repos/repos?apiVersion=2022-11-28#get-all-repository-topics
export const InvalidResponseZodSpec = {
  "/repos/:owner/:repo/topics": {
    get: {
      responses: {
        200: { body: z.object({ noexistProps: z.string().array() }) },
      },
    },
  },
} satisfies ZodApiEndpoints;
export type InvalidResponseSpec = ToApiEndpoints<typeof InvalidResponseZodSpec>;
