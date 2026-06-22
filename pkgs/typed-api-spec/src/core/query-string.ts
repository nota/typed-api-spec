// https://github.com/type-challenges/type-challenges/issues/21419
import { C } from "../compile-error-utils";
import { Replace } from "./type";

export type ParseQueryString<S extends string> = S extends ""
  ? Record<string, never>
  : MergeParams<SplitParams<S>>;

// e.g. 'k1=v1&k2=v2&k2=v3&k1' => ['k1=v1', 'k2=v2', 'k2=v3', 'k1']
type SplitParams<S extends string> = S extends `${infer E}&${infer Rest}`
  ? [E, ...SplitParams<Rest>]
  : [S];

// e.g. ['k1=v1', 'k2=v2', 'k2=v3', 'k1']
// => { k1: 'v1' } => { k1: 'v1', k2: ['v2', 'v3'] } => { k1: ['v1', true], k2: ['v2', 'v3'] }
type MergeParams<T extends string[], M = Record<string, never>> = T extends [
  infer E,
  ...infer Rest extends string[],
]
  ? E extends `${infer K}=${infer V}`
    ? MergeParams<Rest, SetProperty<M, K, V>>
    : E extends `${infer K}`
      ? MergeParams<Rest, SetProperty<M, K>>
      : never
  : M;

// e.g. {} => { K: V }, { K: V1 } => { K: [V1, V] }, { K1: V1 } => { K1: V1, K: V }
export type SetProperty<T, K extends PropertyKey, V = true> = {
  [P in keyof T | K]: P extends K
    ? P extends keyof T // duplicate key exists
      ? T[P] extends V
        ? T[P] // duplicate k-v pair: no change
        : T[P] extends unknown[] // existing value is a tuple
          ? // append new value only if it doesn't already exist in the tuple
            V extends T[P][number]
            ? T[P]
            : [...T[P], V]
          : [T[P], V] // reassign value to tuple initialized with existing and new value
      : V // no duplicate key -> assign new k-v pair
    : P extends keyof T
      ? T[P]
      : never;
};

export type ExtractQuery<URL extends string> =
  URL extends `${string}?${infer Query}` ? Query : undefined;

export type ToQueryUnion<Query extends string> =
  Query extends `${infer Key}=${string}&${infer Rest}`
    ? Replace<Key, "[]", ""> | ToQueryUnion<Rest>
    : Query extends `${infer Key}=${string}`
      ? Replace<Key, "[]", "">
      : Replace<Query, "[]", "">;

export type PickMissingQuery<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  QueryDef extends Record<string, any>,
  QueryKeys extends string,
> = Exclude<NonOptionalKeys<QueryDef> & string, QueryKeys>;

export type PickExcessiveQuery<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  QueryDef extends Record<string, any>,
  QueryKeys extends string,
> = Exclude<QueryKeys, keyof QueryDef>;

export type NonOptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K;
}[keyof T];

export type MissingQueryError<Keys extends string> = {
  reason: `missing query`;
  keys: Keys;
};
export type ExcessiveQueryError<Keys extends string> = {
  reason: `excessive query`;
  keys: Keys;
};

export type ValidateQuery<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  QueryDef extends Record<string, any>,
  QueryKeys extends string,
  // -- local types --
  Missing extends PickMissingQuery<QueryDef, QueryKeys> = PickMissingQuery<
    QueryDef,
    QueryKeys
  >,
  Excessive extends PickExcessiveQuery<QueryDef, QueryKeys> =
    PickExcessiveQuery<QueryDef, QueryKeys>,
> = [Missing] extends [never]
  ? [Excessive] extends [never]
    ? C.OK
    : ExcessiveQueryError<Excessive>
  : [Excessive] extends [never]
    ? MissingQueryError<Missing>
    : MissingQueryError<Missing> | ExcessiveQueryError<Excessive>;
