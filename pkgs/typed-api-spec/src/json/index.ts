// from https://zenn.dev/mizchi/articles/typed-fetch-magic
export type TypedString<T> = string & { _: T };

export type JSON$stringifyT = <T>(
  data: T,
  replacer?: undefined,
  space?: number | string | undefined,
) => TypedString<JsonStringifyResult<T>>;

type JSONT = Omit<JSON, "stringify"> & {
  stringify: JSON$stringifyT;
};

export default JSONT;

// JSONとして有効なプリミティブ型 + Date
type JsonPrimitive = string | number | boolean | null | Date;

// undefined | function | symbol | bigint は JSON化できない (除外 or null or エラー)
// eslint-disable-next-line @typescript-eslint/ban-types
type InvalidJsonValue = undefined | Function | symbol | bigint;

type JsonifyObject<T> = {
  [K in keyof T as K extends string
    ? T[K] extends InvalidJsonValue
      ? never
      : K
    : never]: Jsonify<T[K]>;
};

// タプル型を保持するためのヘルパー型 - 再帰の深さを制限
type JsonifyTuple<T extends readonly unknown[]> = T extends [
  infer First,
  ...infer Rest,
]
  ? [
      First extends InvalidJsonValue ? null : Jsonify<First>,
      ...JsonifyTuple<Rest>,
    ]
  : [];

type Jsonify<T> = T extends { toJSON(): infer R }
  ? Jsonify<R>
  : T extends Date
    ? string
    : T extends JsonPrimitive
      ? T
      : T extends InvalidJsonValue
        ? T
        : T extends readonly [unknown, ...unknown[]] // タプル型の特別処理
          ? JsonifyTuple<T>
          : T extends (infer E)[]
            ? (E extends InvalidJsonValue ? null : Jsonify<E>)[]
            : T extends object
              ? JsonifyObject<T>
              : never;

export type JsonStringifyResult<T> =
  Jsonify<T> extends InvalidJsonValue ? undefined : Jsonify<T>;
