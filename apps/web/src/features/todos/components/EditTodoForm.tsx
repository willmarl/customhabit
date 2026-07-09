import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateTodoSchema,
  type UpdateTodoSchema,
} from "../schemas/updateTodo.schema";
import { useUpdateTodo } from "../hooks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Todo } from "../types/todo";

type Props = {
  todo: Todo;
  onSuccess?: () => void;
};

export default function EditTodoForm({ todo, onSuccess }: Props) {
  const { mutate, isPending } = useUpdateTodo();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdateTodoSchema>({
    resolver: zodResolver(updateTodoSchema),
    mode: "onChange",
    defaultValues: {
      title: todo.title,
      done: todo.done,
    },
  });

  const onSubmit = (data: UpdateTodoSchema) => {
    mutate({ id: todo.id, data }, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <input
          {...register("title")}
          placeholder="Todo title"
          className="border rounded px-3 py-2 w-full"
        />
        {errors.title && (
          <p className="text-destructive text-sm mt-1">
            {errors.title.message}
          </p>
        )}
      </div>
      <label className="flex items-center gap-2">
        <Controller
          control={control}
          name="done"
          render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        Done
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
