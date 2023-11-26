export interface GetTaskParams {
  taskId: string;
}

export interface GetTaskResponse {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  dueDate: Date | null;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  tags: {
    id: number;
    name: string;
    createdAt: Date;
    background: string | null;
  }[];
}
