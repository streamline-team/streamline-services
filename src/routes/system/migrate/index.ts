import { migrate } from "drizzle-orm/mysql2/migrator";
import db, { connection } from "data";

const Migrate = async () => {
  const dbInstance = db();

  await migrate(dbInstance, { migrationsFolder: "./src/data/migrations" });

  await connection().end();
};

export default Migrate;
