import { DefineApiEndpoints, FetchT } from "@notainc/typed-api-spec";

export type PathMap = DefineApiEndpoints<{
  "/users": {
    get: {
      headers: { "Content-Type": "application/json" };
      responses: {
        200: {
          body: { userNames: string[] };
          headers: { "Content-Type": "application/json" };
        };
        400: {
          body: { errorMessage: string };
          headers: { "Content-Type": "application/json" };
        };
      };
    };
  };
}>;

const main = async () => {
  const fetchT = fetch as FetchT<"", PathMap>;
  const res = await fetchT("/users", {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const e = await res.json();
    return console.log(e.errorMessage);
  }
  const r = await res.json();
  console.log(r.userNames);
};

main();
