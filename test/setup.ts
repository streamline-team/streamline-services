import { pool } from "data";

beforeAll(() => null);
afterEach(() => {
  jest.resetAllMocks()
})
afterAll(async () => {
  pool.end();
});
