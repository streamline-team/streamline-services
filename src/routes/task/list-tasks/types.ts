export interface ListTasksQuery {
  title?: string;
  priority?: string;
  done?: string;
  dueAt?: string;
  sortColumn?: string;
  sortOrder?: string;
}
