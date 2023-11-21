import { Hono } from "hono";
import ListTasks from "./list-tasks";
import Controller from "../../config/controller";

const task = new Hono();

task.get(
  "/",
  Controller({
    action: ListTasks,
  })
);

export default task;
