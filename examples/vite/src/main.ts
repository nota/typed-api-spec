import "./style.css";
import {
  withValidation,
  SpecValidatorError,
} from "@notainc/typed-api-spec/fetch";
import { GitHubSpec, InvalidResponseGitHubSpec } from "./github/spec.ts";

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

const GITHUB_API_ORIGIN = "https://api.github.com";
const endpoint = `${GITHUB_API_ORIGIN}/repos/nota/typed-api-spec/topics`;
const result = document.querySelector<HTMLParagraphElement>("#result")!;

const fetchGitHub = import.meta.env.DEV
  ? withValidation(fetch, GitHubSpec)
  : fetch;
const fetchInvalidResponseGitHub = import.meta.env.DEV
  ? withValidation(fetch, InvalidResponseGitHubSpec)
  : fetch;

const fetchButton = document.querySelector<HTMLButtonElement>("#fetch")!;
fetchButton.addEventListener("click", async () => {
  result.innerHTML = "Loading...";
  const response = await fetchGitHub(endpoint, {});
  if (!response.ok) {
    result.innerHTML = `Error: ${response.status} ${response.statusText}`;
    return;
  }
  const { names } = await response.json();
  result.innerHTML = `Result: ${names.join(", ")}`;
});

const invalidFetchButton =
  document.querySelector<HTMLButtonElement>("#invalid-fetch")!;
invalidFetchButton.addEventListener("click", async () => {
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
    if (e instanceof SpecValidatorError) {
      result.innerHTML = `SpecValidatorError: ${e.message}`;
    } else {
      result.innerHTML = `${e}`;
    }
  }
});
