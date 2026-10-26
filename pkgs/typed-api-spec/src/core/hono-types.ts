import { ImmutableHeaders } from "./headers.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlankRecordToNever<T> = T extends any
  ? T extends null
    ? null
    : keyof T extends never
      ? never
      : T
  : never;

export type KnownResponseFormat = "json" | "text";
export type ResponseFormat = KnownResponseFormat | string;
export interface ClientResponse<
  T,
  U extends number = StatusCode,
  F extends ResponseFormat = ResponseFormat,
  H extends Record<string, string> = Record<string, string>,
> extends Omit<globalThis.Response, "headers"> {
  readonly body: ReadableStream | null;
  readonly bodyUsed: boolean;
  ok: U extends SuccessStatusCode
    ? true
    : U extends Exclude<StatusCode, SuccessStatusCode>
      ? false
      : boolean;
  status: U;
  statusText: string;
  headers: ImmutableHeaders<H>;
  url: string;
  redirect(url: string, status: number): Response;
  clone(): Response;
  json(): F extends "text"
    ? Promise<never>
    : F extends "json"
      ? Promise<BlankRecordToNever<T>>
      : Promise<unknown>;
  text(): F extends "text"
    ? T extends string
      ? Promise<T>
      : Promise<never>
    : Promise<string>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export type InfoStatusCode = 100 | 101 | 102 | 103;
export type SuccessStatusCode =
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 207
  | 208
  | 226;
export type DeprecatedStatusCode = 305 | 306;
export type RedirectStatusCode =
  | 300
  | 301
  | 302
  | 303
  | 304
  | DeprecatedStatusCode
  | 307
  | 308;
export type ClientErrorStatusCode =
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 421
  | 422
  | 423
  | 424
  | 425
  | 426
  | 428
  | 429
  | 431
  | 451;
export type ServerErrorStatusCode =
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505
  | 506
  | 507
  | 508
  | 510
  | 511;

export type StatusCode =
  | InfoStatusCode
  | SuccessStatusCode
  | RedirectStatusCode
  | ClientErrorStatusCode
  | ServerErrorStatusCode;
