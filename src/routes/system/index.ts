import { Hono } from "hono";
import Migrate from "./migrate";
import Controller, { successResponse } from "config/controller";

const system = new Hono();

system.get("/ping", (ctx) => {
  return successResponse({
    ctx,
    data: "pong",
  });
});

system.put(
  "/migrate",
  Controller({
    action: Migrate,
    disableAuth: true,
  })
);

export default system;
