import { Hono } from "hono";
import ListTasks from "./list-tasks";
import Controller from "../../config/controller";
import GetTask from "./get-task";
import CreateTask from "./create-task";
import DeleteTask from "./delete-task";
import UpdateTask from "./update-task";
import AddTagToTask from "./add-tag-to-task";
import RemoveTagFromTask from "./remove-tag-from-task";

const task = new Hono();

task.get(
  "/",
  Controller({
    action: ListTasks,
  })
);

task.post(
  "/",
  Controller({
    action: CreateTask,
  })
);

task.get(
  "/:taskId",
  Controller({
    action: GetTask,
  })
);

task.delete(
  "/:taskId",
  Controller({
    action: DeleteTask,
  })
);

task.patch(
  "/:taskId",
  Controller({
    action: UpdateTask,
  })
);

task.post(
  "/:taskId/tag/:tagId",
  Controller({
    action: AddTagToTask,
  })
);

task.delete(
  "/:taskId/tag/:tagId",
  Controller({
    action: RemoveTagFromTask,
  })
);

export default task;
