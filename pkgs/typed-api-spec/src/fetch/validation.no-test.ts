// FIXME: standard-schema対応が終わったらテストを書く
// import { withValidation } from "./validation";
// import { describe, it, expect, vi } from "vitest";
// import { z } from "zod";
// import { toLCObj } from "../utils";
// import { newSSValidator, SSApiEndpoints } from "../ss";

// const newMockFetch = (
//   body: Record<string, string>,
//   headers: Record<string, string>,
// ) => newRawMockFetch(body, { headers: toLCObj(headers) });
// const newRawMockFetch = (body: Record<string, string>, init: ResponseInit) =>
//   vi.fn(
//     () => new Response(JSON.stringify(body), init),
//   ) as unknown as typeof fetch;
// describe("withValidation", () => {
//   const pathMap = {
//     "/:paramsName": {
//       get: {
//         query: z.object({ queryName: z.string() }),
//         headers: z.object(toLCObj({ headersName: z.string() })),
//         params: z.object({ paramsName: z.string() }),
//         responses: {
//           200: {
//             body: z.object({ bodyNameRes: z.string() }),
//             headers: z.object(toLCObj({ headersNameRes: z.string() })),
//           },
//           400: { body: z.object({ message: z.string() }) },
//         },
//       },
//       post: {
//         body: z.object({ bodyName: z.string() }),
//         responses: { 200: { body: z.object({ bodyNameRes: z.string() }) } },
//       },
//     },
//   } satisfies SSApiEndpoints;
//   const path = "/p?queryName=q";
//   describe("invalid request", () => {
//     const ft = newMockFetch({ bodyNameRes: "b" }, { headersNameRes: "h" });
//     const { req, res } = newSSValidator(pathMap);
//     const fetchV = withValidation(ft, pathMap, req, res);
//     it("query", async () => {
//       await expect(() =>
//         fetchV("/p", { headers: { headersName: "h" } }),
//       ).rejects.toThrow(
//         '{"reason":"query","issues":[{"code":"invalid_type","expected":"string","received":"undefined","path":["queryName"],"message":"Required"}],"name":"ZodError"}',
//       );
//     });
//     it("headers", async () => {
//       await expect(() => fetchV(path, { headers: {} })).rejects.toThrow(
//         '{"reason":"headers","issues":[{"code":"invalid_type","expected":"string","received":"undefined","path":["headersname"],"message":"Required"}],"name":"ZodError"}',
//       );
//     });
//     it("body", async () => {
//       await expect(() =>
//         fetchV(path, {
//           method: "post",
//           body: "{}",
//           headers: { headersName: "h" },
//         }),
//       ).rejects.toThrow(
//         '{"reason":"body","issues":[{"code":"invalid_type","expected":"string","received":"undefined","path":["bodyName"],"message":"Required"}],"name":"ZodError"}',
//       );
//     });
//   });
//   describe("status code 200", () => {
//     it("valid response", async () => {
//       const ft = newMockFetch({ bodyNameRes: "b" }, { headersNameRes: "h" });
//       const { req, res } = newSSValidator(pathMap);
//       const fetchV = withValidation(ft, pathMap, req, res);
//       const r = await fetchV(path, { headers: { headersName: "h" } });
//       expect(await r.json()).toEqual({ bodyNameRes: "b" });
//     });
//     describe("invalid response", () => {
//       it("body", async () => {
//         const ft = newMockFetch(
//           { invalid: "invalid" },
//           { headersNameRes: "h" },
//         );
//         const { req, res } = newSSValidator(pathMap);
//         const fetchV = withValidation(ft, pathMap, req, res);
//         await expect(() =>
//           fetchV(path, { headers: { headersName: "h" } }),
//         ).rejects.toThrow(
//           '{"reason":"body","issues":[{"code":"invalid_type","expected":"string","received":"undefined","path":["bodyNameRes"],"message":"Required"}],"name":"ZodError"}',
//         );
//       });
//       it("headers", async () => {
//         const ft = newMockFetch({ bodyNameRes: "b" }, { invalid: "invalid" });
//         const { req, res } = newSSValidator(pathMap);
//         const fetchV = withValidation(ft, pathMap, req, res);
//         await expect(() =>
//           fetchV(path, { headers: { headersName: "h" } }),
//         ).rejects.toThrow(
//           '{"reason":"headers","issues":[{"code":"invalid_type","expected":"string","received":"undefined","path":["headersnameres"],"message":"Required"}],"name":"ZodError"}',
//         );
//       });
//     });
//   });
//   describe("status code 400", () => {
//     it("valid response", async () => {
//       const ft = newRawMockFetch(
//         { message: "m" },
//         {
//           headers: toLCObj({ headersNameRes: "h" }),
//           status: 400,
//         },
//       );
//       const { req, res } = newSSValidator(pathMap);
//       const fetchV = withValidation(ft, pathMap, req, res);
//       const r = await fetchV(path, { headers: { headersName: "h" } });
//       expect(await r.json()).toEqual({ message: "m" });
//     });
//   });
// });
