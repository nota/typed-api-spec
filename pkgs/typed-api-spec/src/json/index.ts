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

// 配列要素の変換: 不適切な値は null に
type JsonifyArrayElement<T> = T extends InvalidJsonValue ? null : Jsonify<T>;

// オブジェクトの変換
type JsonifyObject<T> = {
  // keyof T から string 型のキーのみを抽出 (シンボルキーを除外)
  [K in keyof T as K extends string
    ? // プロパティの値 T[K] を Jsonify した結果を ProcessedValue とする
      Jsonify<T[K]> extends infer ProcessedValue
      ? // ProcessedValue が 不適切な型なら、このプロパティ自体を除外 (never)
        ProcessedValue extends InvalidJsonValue
        ? never
        : // そうでなければキー K を採用
          K
      : never
    : never]: Jsonify<T[K]>; // ↑で採用されたキー K に対して、変換後の値 ProcessedValue を割り当て
};

// メインの再帰型
type Jsonify<T> =
  // 1. toJSONメソッドを持つか？ -> あればその返り値を Jsonify
  T extends { toJSON(): infer R }
    ? Jsonify<R>
    : // 2. Dateか？ -> string
      T extends Date
      ? string
      : // 3. その他のプリミティブか？ -> そのまま
        T extends JsonPrimitive
        ? T
        : // 4. 不適切な値か？ -> そのまま (呼び出し元で処理)
          T extends InvalidJsonValue
          ? T
          : // 5. 配列か？ -> 各要素を JsonifyArrayElement で変換
            T extends Array<infer E>
            ? Array<JsonifyArrayElement<E>>
            : // 6. オブジェクトか？ -> JsonifyObject で変換
              T extends object
              ? JsonifyObject<T>
              : // 7. それ以外 (通常は到達しない) -> never
                never;

// 最終的な型: トップレベルでの undefined/function/symbol/bigint は undefined になる
export type JsonStringifyResult<T> =
  Jsonify<T> extends InvalidJsonValue ? undefined : Jsonify<T>;
