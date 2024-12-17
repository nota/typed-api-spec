import { newFetch } from "@notainc/typed-api-spec/zod/validation";
export const GITHUB_API_ORIGIN = "https://api.github.com";

const newFetchGitHub = newFetch(async () => (await import("./spec.ts")).ZodSpec, import.meta.env.DEV);
export const fetchGitHub = await newFetchGitHub<typeof GITHUB_API_ORIGIN>();

const newFetchInvalidResponseGitHub = newFetch( async () => (await import("./spec.ts")).InvalidResponseZodSpec, import.meta.env.DEV);
export const fetchInvalidResponseGitHub = await newFetchInvalidResponseGitHub<typeof GITHUB_API_ORIGIN>();
