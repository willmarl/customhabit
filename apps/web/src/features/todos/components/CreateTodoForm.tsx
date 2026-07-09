import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTodoSchema,
  type CreateTodoSchema,
} from "../schemas/createTodo.schema";
import { useCreateTodo } from "../hooks";
import { Button } from "@/components/ui/button";

type Props = {
  onSuccess?: () => void;
};

export default function CreateTodoForm({ onSuccess }: Props) {
  const { mutate, isPending } = useCreateTodo();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTodoSchema>({
    resolver: zodResolver(createTodoSchema),
    mode: "onChange",
  });

  const onSubmit = (data: CreateTodoSchema) => {
    mutate(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
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
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Todo"}
      </Button>
    </form>
  );
}
