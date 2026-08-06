import { ImmutableHeaders } from "./headers";

{
  type ContentType =
    | { "Content-Type": "application/json" }
    | { "content-type": "application/json" };
  const headers = new Headers({
    "Content-Type": "application/json",
  }) as unknown as ImmutableHeaders<ContentType & { optionalKey?: string }>;

  const contentType: "application/json" = headers.get("Content-Type");

  const contentType2: "application/json" = headers.get("content-type");

  const hasContentType: true = headers.has("Content-Type");

  const optionalKey: boolean = headers.has("optionalKey");
}
