import { pool } from "data";

beforeAll(() => null);
afterAll(async () => {
  pool.end();
});
