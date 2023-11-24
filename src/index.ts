import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import routes from "./config/routes";
import db from "./data";

const main = async (): Promise<void> => {
  try {
    if (module !== require.main) {
      return;
    }

    db();

    const port: number = process.env.PORT
      ? parseInt(process.env.PORT, 10)
      : 8080;

    const app = new Hono();

    app.use("*", cors());

    app.route("/", routes);

    serve({
      fetch: app.fetch,
      port,
    });

    console.log(`Started on ${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default main();
