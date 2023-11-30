import { Hono } from "hono";
import Migrate from "./migrate";
import Controller from "config/controller";

const system = new Hono();

system.get("/ping", (ctx) => {
  return ctx.json({
    ping: "pong",
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
