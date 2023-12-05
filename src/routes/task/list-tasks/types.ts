import { Tag, Task } from "data/schema";

export interface ListTasksQuery {
  title?: string;
  priority?: string;
  done?: string;
  dueAt?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface ListTag extends Omit<Tag, "updatedAt" | "userId"> {}

export interface TasksWithTags extends Omit<Task, "userId"> {
  tags: ListTag[];
}

export type ListTasksResponse = TasksWithTags[];
