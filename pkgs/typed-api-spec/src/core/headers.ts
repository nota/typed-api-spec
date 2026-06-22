import { AllKeys, AllValues, IsOptional } from "./type";

export interface ImmutableHeaders<
  H extends Record<string, string>,
> extends Omit<Headers, "set" | "append" | "delete"> {
  get<Name extends AllKeys<H>>(name: Name): AllValues<H, Name>;
  has<Name extends AllKeys<H>>(
    name: Name,
  ): IsOptional<H, Name> extends true ? boolean : true;
  forEach(
    callbackfn: <Name extends AllKeys<H> & string>(
      value: AllValues<H, Name>,
      key: Name,
      parent: Headers,
    ) => void,
  ): void;
}
