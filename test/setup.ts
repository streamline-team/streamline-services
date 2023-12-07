import db, { pool } from "data";
import { migrate } from "drizzle-orm/mysql2/migrator";

beforeAll(async () => {
  const dbInstance = db();

  await migrate(dbInstance, {
    migrationsFolder: "./src/data/migrations",
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

afterAll(async () => {
  pool.end();
});
