import type { FieldValues, UseFormProps } from "react-hook-form";
import type { ZodType, ZodTypeDef } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm as __useForm } from "react-hook-form";

export function useForm<TOut extends FieldValues, TDef extends ZodTypeDef, TIn extends FieldValues>(
  props: Omit<UseFormProps<TIn, unknown, TOut>, "resolver"> & {
    schema: ZodType<TOut, TDef, TIn>;
  }
) {
  const form = __useForm<TIn, unknown, TOut>({
    ...props,
    resolver: zodResolver(props.schema as any),
  });

  return form;
}
