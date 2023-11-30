import { GetTaskResponse } from "../get-task/types";

export interface RemoveTagFromTaskParams {
  taskId: string;
  tagId: string;
}

export type RemoveTagFromTaskResponse = GetTaskResponse;
