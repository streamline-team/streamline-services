import { Hono } from "hono";
import ListTasks from "./list-tasks";
import Controller from "../../config/controller";
import GetTask from "./get-task";

const task = new Hono();

task.get(
  "/",
  Controller({
    action: ListTasks,
  })
);

task.get(
  "/:taskId",
  Controller({
    action: GetTask,
  })
);

export default task;
