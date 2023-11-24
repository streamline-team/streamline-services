import { serve } from "@hono/node-server";
import { Hono } from "hono";
import routes from "./config/routes";
import { tasks } from "./data/schema";
import db from "./data";

const main = async (): Promise<void> => {
  try {
    if (module !== require.main) {
      return;
    }

    // Trust GCP X-Forwarded

    const repo = db();

    const test = await repo.select().from(tasks);

    console.log(test);

    const port: number = process.env.PORT
      ? parseInt(process.env.PORT, 10)
      : 8080;

    const app = new Hono();

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
