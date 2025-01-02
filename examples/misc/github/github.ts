import { DefineApiEndpoints, FetchT } from "@notainc/typed-api-spec";

const GITHUB_API_ORIGIN = "https://api.github.com";

// There are more headers, but I omit them for simplicity
type ResponseHeaders = Record<
  "x-ratelimit-remaining" | "x-ratelimit-reset" | "x-github-request-id",
  string
>;

// See https://docs.github.com/ja/rest/repos/repos?apiVersion=2022-11-28#get-all-repository-topics
type Spec = DefineApiEndpoints<{
  "/repos/:owner/:repo/topics": {
    get: {
      query: { page?: string };
      headers: {
        Accept?: "application/vnd.github+json";
        Authorization?: `Bearer ${string}`;
        "X-GitHub-Api-Version"?: "2022-11-28";
      };
      responses: {
        200: {
          body: { names: string[] };
          headers: ResponseHeaders;
        };
        400: {
          body: {
            message: string;
            errors: string;
            documentation_url: string;
            status: number;
          };
          headers: ResponseHeaders;
        };
      };
    };
  };
}>;
const fetchT = fetch as FetchT<typeof GITHUB_API_ORIGIN, Spec>;

const main = async () => {
  const response = await fetchT(
    `${GITHUB_API_ORIGIN}/repos/nota/typed-api-spec/topics?page=1`,
    { headers: { Accept: "application/vnd.github+json" } },
  );
  if (!response.ok) {
    const { message } = await response.json();
    return console.error(message);
  }
  const { names } = await response.json();
  console.log(names);
};

main();
