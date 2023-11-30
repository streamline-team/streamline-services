import { GetTaskResponse } from "../get-task/types";

export interface UpdateTaskParams {
  taskId: string;
}
export interface UpdateTaskBody {
  title?: string;
  description?: string | null;
  dueAt?: string | null;
  priority?: number | null;
  done?: boolean;
}

export type UpdateTaskResponse = GetTaskResponse;
