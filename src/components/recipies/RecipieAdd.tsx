import * as z from "zod";
import { useForm } from "@/hooks/use-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RecipieFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
});

type RecipieFormSchemaType = z.infer<typeof RecipieFormSchema>;

export const RecipieAdd = () => {
  const form = useForm({
    schema: RecipieFormSchema,
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: RecipieFormSchemaType) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Recipie name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Recipie description"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
        >
          Add Recipie
        </Button>
      </form>
    </Form>
  );
};
