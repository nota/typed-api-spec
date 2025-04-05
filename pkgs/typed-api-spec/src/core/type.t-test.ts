import { Equal, Expect } from "./type-test";
import {
  AllKeys,
  AllValues,
  And,
  CountChar,
  ExtractByPrefix,
  FilterNever,
  IsAllOptional,
  IsEqualNumber,
  IsOptional,
  Replace,
  ReplaceAll,
  SameSlashNum,
  Split,
} from "./type";
import { NormalizePath } from "./url";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type FilterNeverCases = [
  // eslint-disable-next-line @typescript-eslint/ban-types
  Expect<Equal<FilterNever<{ a: never }>, {}>>,
  Expect<Equal<FilterNever<{ a: never; b: string }>, { b: string }>>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SplitTestCases = [
  Expect<Equal<Split<"", "">, []>>,
  Expect<Equal<Split<"a", "">, ["a"]>>,
  Expect<Equal<Split<"ab", "">, ["a", "b"]>>,
  Expect<Equal<Split<"a/b", "/">, ["a", "b"]>>,
  Expect<Equal<Split<"/a/b", "/">, ["", "a", "b"]>>,
  Expect<Equal<Split<"a/b/c", "/">, ["a", "b", "c"]>>,
  Expect<Equal<Split<"a/b/", "/">, ["a", "b", ""]>>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ReplaceTestCases = [
  Expect<Equal<Replace<"a", "a", "-">, "-">>,
  Expect<Equal<Replace<"a", "noexist", "-">, "a">>,
  Expect<Equal<Replace<"a", "a", "a">, "a">>,
  Expect<Equal<Replace<"abcd", "ab", "-">, "-cd">>,
  Expect<Equal<Replace<"abcd", "cd", "-">, "ab-">>,
  Expect<Equal<Replace<"abcd", "bc", "-">, "a-d">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ReplaceAllTestCases = [
  Expect<Equal<ReplaceAll<"a", "a", "-">, "-">>,
  Expect<Equal<ReplaceAll<"a", "noexist", "-">, "a">>,
  Expect<Equal<ReplaceAll<"a", "a", "a">, "a">>,
  Expect<Equal<ReplaceAll<"abcd", "ab", "-">, "-cd">>,
  Expect<Equal<ReplaceAll<"abcd", "cd", "-">, "ab-">>,
  Expect<Equal<ReplaceAll<"abcd", "bc", "-">, "a-d">>,
  Expect<Equal<ReplaceAll<"aab", "a", "-">, "--b">>,
  Expect<Equal<ReplaceAll<"aba", "a", "-">, "-b-">>,
  Expect<Equal<ReplaceAll<"aabaa", "aa", "-">, "-b-">>,
  Expect<Equal<ReplaceAll<"aaaba", "aa", "-">, "-aba">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ExtractByPrefixTestCases = [
  Expect<Equal<ExtractByPrefix<"", "">, "">>,
  Expect<Equal<ExtractByPrefix<"a", "">, "a">>,
  Expect<Equal<ExtractByPrefix<"a" | "b", "">, "a" | "b">>,
  Expect<Equal<ExtractByPrefix<"a", ":">, never>>,
  Expect<Equal<ExtractByPrefix<":a", ":">, "a">>,
  Expect<Equal<ExtractByPrefix<":a" | "b", ":">, "a">>,
  Expect<Equal<ExtractByPrefix<"a" | ":b", ":">, "b">>,
  Expect<Equal<ExtractByPrefix<":a" | ":b", ":">, "a" | "b">>,
  Expect<Equal<ExtractByPrefix<":a" | ":b" | ":c", ":">, "a" | "b" | "c">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type NormalizePathTestCases = [
  Expect<Equal<NormalizePath<"users//">, "users/">>,
  Expect<Equal<NormalizePath<"//users">, "/users">>,
  Expect<Equal<NormalizePath<"users//:userId">, "users/:userId">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type IsEqualNumberTestCases = [
  Expect<Equal<IsEqualNumber<1, 1>, true>>,
  Expect<Equal<IsEqualNumber<1, 2>, false>>,
  Expect<Equal<IsEqualNumber<1, 1 | 2>, false>>,
  Expect<Equal<IsEqualNumber<1 | 2, 1 | 2>, true>>,
  Expect<Equal<IsEqualNumber<1 | 2, 1>, false>>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CountCharTestCases = [
  Expect<Equal<CountChar<"a", "a">, 1>>,
  Expect<Equal<CountChar<"a", "b">, 0>>,
  Expect<Equal<CountChar<"a", "">, 0>>,
  Expect<Equal<CountChar<"a", "a" | "b">, 1>>,
  Expect<Equal<CountChar<"ab", "a" | "b">, 2>>,
  Expect<Equal<CountChar<"ab", "c">, 0>>,
  Expect<Equal<CountChar<"abc", "a" | "b">, 2>>,
  Expect<Equal<CountChar<"a" | "b", "a">, 0 | 1>>,

  Expect<Equal<CountChar<"banana", "a">, 3>>,
  Expect<Equal<CountChar<"banana", "b">, 1>>,
  Expect<Equal<CountChar<"banana", "n">, 2>>,
  Expect<Equal<CountChar<"banana", "x">, 0>>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SameSlashNumTestCases = [
  Expect<Equal<SameSlashNum<"", "">, true>>,
  Expect<Equal<SameSlashNum<"/a", "/b">, true>>,
  Expect<Equal<SameSlashNum<"/a", "/a/">, false>>,
  Expect<Equal<SameSlashNum<string, "/">, false>>,
  Expect<Equal<SameSlashNum<`/${string}`, "/a">, true>>,
  Expect<Equal<SameSlashNum<`/${string}`, "/a/b">, false>>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type IsOptionalTestCases = [
  // eslint-disable-next-line @typescript-eslint/ban-types
  Expect<Equal<IsOptional<{ a: string; b?: string }, "a">, false>>,
  Expect<Equal<IsOptional<{ a: string; b?: string }, "b">, true>>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type IsAllOptionalTestCases = [
  // eslint-disable-next-line @typescript-eslint/ban-types
  Expect<Equal<IsAllOptional<{}>, true>>,
  Expect<Equal<IsAllOptional<{ a?: string }>, true>>,
  Expect<Equal<IsAllOptional<{ a: string }>, false>>,
  Expect<Equal<IsAllOptional<{ a?: string; b: string }>, false>>,
  Expect<Equal<IsAllOptional<{ a?: string; b?: string }>, true>>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AllKeysTestCases = [
  Expect<Equal<AllKeys<{ a: string } | { b: string }>, "a" | "b">>,
  Expect<Equal<AllKeys<{ a: string } | { a: string; b: string }>, "a" | "b">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AllValuesTestCases = [
  Expect<Equal<AllValues<{ a: 1 } | { a: 2 }, "a">, 1 | 2>>,
  Expect<Equal<AllValues<{ a: 1; b: 3 } | { a: 2 }, "b">, 3>>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AndTestCases = [
  Expect<Equal<And<[]>, true>>, // An empty tuple evaluates to true
  Expect<Equal<And<[true]>, true>>, // Single element true
  Expect<Equal<And<[false]>, false>>, // Single element false
  Expect<Equal<And<[true, true]>, true>>, // All elements are true
  Expect<Equal<And<[true, false]>, false>>, // Contains false
  Expect<Equal<And<[false, true]>, false>>, // Contains false
  Expect<Equal<And<[false, false]>, false>>, // All elements are false
  Expect<Equal<And<[true, true, true]>, true>>, // Multiple true elements
  Expect<Equal<And<[true, true, false]>, false>>, // Multiple elements containing false
  Expect<Equal<And<boolean[]>, boolean>>, // boolean[] type
];
