import { describe, expect, it } from "vitest";
import { JsonStringifyResult } from ".";
import { Equal, Expect } from "../core/type-test";

const l: unique symbol = Symbol("l");
describe("JsonStringifyResult", () => {
  it("should work", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type MyType = {
      a: string;
      b: number;
      c: boolean;
      d: null;
      e: undefined;
      f: () => void;
      g: symbol;
      h: bigint;
      i: Date;
      j: { nested: string; undef: undefined };
      k: (string | undefined | Date)[];
      [l]: string;
      m: { toJSON: () => { x: number; y: string | undefined } };
      n: [number, number];
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type T = Expect<
      Equal<
        JsonStringifyResult<MyType>,
        {
          a: string;
          b: number;
          c: boolean;
          d: null;
          i: string;
          j: { nested: string };
          k: (string | null)[];
          // FIXME: y should be optional
          m: { x: number; y: string | undefined };
          n: [number, number];
        }
      >
    >;

    const example: MyType = {
      a: "hello",
      b: 123,
      c: true,
      d: null,
      e: undefined,
      f: () => {
        console.log("func");
      },
      g: Symbol("g"),
      h: 123n,
      i: new Date(),
      j: { nested: "world", undef: undefined },
      k: ["a", undefined, new Date("2021-01-01")],
      [l]: "symbol keyed value",
      m: { toJSON: () => ({ x: 1, y: undefined }) },
      n: [1, 2],
    };

    expect(JSON.parse(JSON.stringify({ ...example, h: undefined }))).toEqual({
      a: "hello",
      b: 123,
      c: true,
      d: null,
      i: example.i.toISOString(),
      j: { nested: "world" },
      k: ["a", null, "2021-01-01T00:00:00.000Z"],
      m: { x: 1 },
      n: [1, 2],
    });
  });
});
