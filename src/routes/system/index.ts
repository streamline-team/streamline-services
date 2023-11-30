import { Hono } from "hono";
import Migrate from "./migrate";
import Controller, { successResponse } from "config/controller";

const system = new Hono();

system.get("/", (ctx) => {
  const verificationCode = process.env.APP_GOOGLE_VERIFY_CODE;

  return ctx.html(
    `<html><head><meta name="google-site-verification" content="${verificationCode}" /></head><body></body></html>`
  );
});

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
