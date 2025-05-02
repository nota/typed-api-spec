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

type JsonifyArrayElement<T> = T extends InvalidJsonValue ? null : Jsonify<T>;

type JsonifyObject<T> = {
  [K in keyof T as K extends string
    ? Jsonify<T[K]> extends infer ProcessedValue
      ? ProcessedValue extends InvalidJsonValue
        ? never
        : K
      : never
    : never]: Jsonify<T[K]>;
};

// タプル型を保持するためのヘルパー型
type JsonifyTuple<T extends readonly unknown[]> = {
  [K in keyof T]: T[K] extends InvalidJsonValue ? null : Jsonify<T[K]>;
};

type Jsonify<T> = T extends { toJSON(): infer R }
  ? Jsonify<R>
  : T extends Date
    ? string
    : T extends JsonPrimitive
      ? T
      : T extends InvalidJsonValue
        ? T
        : T extends readonly [unknown, ...unknown[]] // T may be tuple
          ? JsonifyTuple<T>
          : T extends Array<infer E>
            ? Array<JsonifyArrayElement<E>>
            : T extends object
              ? JsonifyObject<T>
              : never;

export type JsonStringifyResult<T> =
  Jsonify<T> extends InvalidJsonValue ? undefined : Jsonify<T>;
