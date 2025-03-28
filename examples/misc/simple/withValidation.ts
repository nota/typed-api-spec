import { withValidation } from "@notainc/typed-api-spec/fetch";
import { z } from "zod";
import { SpecValidatorError } from "@notainc/typed-api-spec/fetch";
import { ApiEndpointsSchema } from "@notainc/typed-api-spec/core";

const GITHUB_API_ORIGIN = "https://api.github.com";

// See https://docs.github.com/ja/rest/repos/repos?apiVersion=2022-11-28#get-all-repository-topics
const spec = {
  "/repos/:owner/:repo/topics": {
    get: {
      responses: { 200: { body: z.object({ names: z.string().array() }) } },
    },
  },
} satisfies ApiEndpointsSchema;
const spec2 = {
  "/repos/:owner/:repo/topics": {
    get: {
      // Invalid response schema
      responses: { 200: { body: z.object({ noexist: z.string() }) } },
    },
  },
} satisfies ApiEndpointsSchema;

const main = async () => {
  {
    // const fetchT = fetch as FetchT<typeof GITHUB_API_ORIGIN, Spec>;
    const fetchWithV = withValidation(fetch, spec);
    const response = await fetchWithV(
      `${GITHUB_API_ORIGIN}/repos/nota/typed-api-spec/topics?page=1`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!response.ok) {
      const { message } = await response.json();
      return console.error(message);
    }
    const { names } = await response.json();
    console.log(names);
  }

  {
    // const fetchT = fetch as FetchT<typeof GITHUB_API_ORIGIN, Spec>;
    const fetchWithV = withValidation(fetch, spec2);
    try {
      await fetchWithV(
        `${GITHUB_API_ORIGIN}/repos/nota/typed-api-spec/topics?page=1`,
        { headers: { Accept: "application/vnd.github+json" } },
      );
    } catch (e) {
      if (e instanceof SpecValidatorError) {
        console.log("error thrown", e);
      } else {
        throw e;
      }
    }
  }
};

main();
