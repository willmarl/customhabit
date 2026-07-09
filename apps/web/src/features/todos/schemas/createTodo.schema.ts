import { z } from "zod";

export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  done: z.boolean().optional(),
});

export type CreateTodoSchema = z.infer<typeof createTodoSchema>;
