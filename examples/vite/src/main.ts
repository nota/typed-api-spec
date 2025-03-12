import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>typed-api-spec + Vite</h1>
    <div class="card">
      <button id="fetch" type="button">Fetch from GitHub</button>
    </div>
    <div class="card">
      <button id="invalid-fetch" type="button">Invalid fetch from GitHub</button>
    </div>
    <p id="result">
      Topics of typed-api-spec will be displayed here after clicking the button.
    </p>
  </div>
`;

import { newFetch } from "@notainc/typed-api-spec/zod";
const GITHUB_API_ORIGIN = "https://api.github.com";

const endpoint = `${GITHUB_API_ORIGIN}/repos/nota/typed-api-spec/topics`;
const result = document.querySelector<HTMLParagraphElement>("#result")!;

const fetchButton = document.querySelector<HTMLButtonElement>("#fetch")!;
const request = async () => {
  const specLoader = async () => (await import("./github/spec.ts")).GitHubSpec;
  const fetchGitHub = await newFetch(specLoader, import.meta.env.DEV)<
    typeof GITHUB_API_ORIGIN
  >();

  result.innerHTML = "Loading...";
  const response = await fetchGitHub(endpoint, {});
  if (!response.ok) {
    result.innerHTML = `Error: ${response.status} ${response.statusText}`;
    return;
  }
  const { names } = await response.json();
  result.innerHTML = `Result: ${names.join(", ")}`;
};
fetchButton.addEventListener("click", () => request());

const invalidFetchButton =
  document.querySelector<HTMLButtonElement>("#invalid-fetch")!;
const invalidRequest = async () => {
  const specLoader = async () =>
    (await import("./github/spec.ts")).InvalidResponseGitHubSpec;
  const fetchInvalidResponseGitHub = await newFetch(
    specLoader,
    import.meta.env.DEV
  )<typeof GITHUB_API_ORIGIN>();

  result.innerHTML = "Loading...";
  try {
    const response = await fetchInvalidResponseGitHub(endpoint, {});
    if (!response.ok) {
      result.innerHTML = `Error: ${response.status} ${response.statusText}`;
      return;
    }
    const { noexistProps } = await response.json();
    result.innerHTML = `Result: ${noexistProps.join(", ")}`;
  } catch (e) {
    result.innerHTML = `${e}`;
  }
};
invalidFetchButton.addEventListener("click", () => invalidRequest());
