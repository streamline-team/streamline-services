import { Hono } from "hono";
import Migrate from "./migrate";

const system = new Hono();

system.get("/ping");
system.put("/migrate", Migrate);

export default system;
