import { agentRequest, it } from "test/utils";

describe("System routes", () => {
  it("should return pong", async () => {
    const runMigrationsResponse = await agentRequest<{}>("/system/ping", {
      method: "GET",
    });

    const { meta, data } = runMigrationsResponse;

    expect(meta.code).toBe(200);
    expect(data).toEqual("pong");
  });
});
