import { z } from "zod";

export const updateTodoSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  done: z.boolean().optional(),
});

export type UpdateTodoSchema = z.infer<typeof updateTodoSchema>;
