import { agentRequest, it } from "test/utils";

describe("PUT /system/migrate", () => {
  it("should return 200, no pending migrations", async () => {
    const runMigrationsResponse = await agentRequest<{}>("/system/migrate", {
      method: "PUT",
    });

    const { meta, data } = runMigrationsResponse;

    expect(meta.code).toBe(200);
    expect(data).toEqual({});
  });
});
