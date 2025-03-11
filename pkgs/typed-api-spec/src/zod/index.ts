import { z, ZodType } from "zod";

export const anyZ = <T>() => z.any() as ZodType<T>;
export * from "./validation";
