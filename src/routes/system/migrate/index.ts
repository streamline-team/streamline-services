import { migrate } from "drizzle-orm/mysql2/migrator";
import db from "data";
import { ActionResponse } from "config/types";

const Migrate = async (): ActionResponse<{}> => {
  const dbInstance = db();

  await migrate(dbInstance, {
    migrationsFolder: "./src/data/migrations",
  });

  return {
    isError: false,
    code: 200,
    data: {},
  };
};

export default Migrate;
