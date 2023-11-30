import { GetTaskResponse } from "../get-task/types";

export interface CreateTaskBody {
  title: string;
  description?: string | null;
  dueAt?: string | null;
  priority?: number | null;
  tags?: number[];
}

export type CreateTaskResponse = GetTaskResponse;
