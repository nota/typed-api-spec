import z from "zod";
import { SSApiEndpoints, ToApiEndpoints } from "@notainc/typed-api-spec/ss";

// See https://docs.github.com/ja/rest/repos/repos?apiVersion=2022-11-28#get-all-repository-topics
export const GitHubSpec = {
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
} satisfies SSApiEndpoints;
export type Spec = ToApiEndpoints<typeof GitHubSpec>;

// See https://docs.github.com/ja/rest/repos/repos?apiVersion=2022-11-28#get-all-repository-topics
export const InvalidResponseGitHubSpec = {
  "/repos/:owner/:repo/topics": {
    get: {
      responses: {
        200: { body: z.object({ noexistProps: z.string().array() }) },
      },
    },
  },
} satisfies SSApiEndpoints;
export type InvalidResponseSpec = ToApiEndpoints<
  typeof InvalidResponseGitHubSpec
>;
