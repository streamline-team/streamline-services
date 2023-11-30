export interface ListTasksQuery {
  title?: string;
  priority?: number;
  done?: boolean;
  dueAt?: string;
  sort?: {
    column: string;
    order?: string;
  };
}
