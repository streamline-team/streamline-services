import Controller from "config/controller";
import { Hono } from "hono";
import UpdateUser from "./update-user";
import GetUser from "./get-user";

const user = new Hono();

user.get(
  "/",
  Controller({
    action: GetUser,
  })
);

user.patch(
  "/",
  Controller({
    action: UpdateUser,
  })
);

export default user;
