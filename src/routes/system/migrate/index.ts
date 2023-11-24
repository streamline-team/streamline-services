import { migrate } from "drizzle-orm/mysql2/migrator";
import db, { pool } from "data";

const Migrate = async () => {
  const dbInstance = db();

  await migrate(dbInstance, { migrationsFolder: "./src/data/migrations" });

  pool.end();
};

export default Migrate;
