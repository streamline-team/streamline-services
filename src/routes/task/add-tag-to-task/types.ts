import { GetTaskResponse } from "../get-task/types";

export interface AddTagToTaskParams {
  taskId: string;
  tagId: string;
}

export type AddTagToTaskResponse = GetTaskResponse;
