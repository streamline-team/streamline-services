import { GetTaskResponse } from "../get-task/types";

export interface CreateTaskBody {
  title: string;
  description?: string | null;
  dueAt?: string | null;
  priority?: number | null;
}

export type CreateTaskResponse = GetTaskResponse;
