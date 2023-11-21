import { Hono } from "hono";
import system from "../routes/system";
import task from "../routes/task";
import user from "../routes/user";

const routes = new Hono();

routes.route("/system", system);
routes.route("/task", task);
routes.route("/user", user);

export default routes;
