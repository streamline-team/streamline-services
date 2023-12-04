import { tag, user } from "data/schema";
import { it, agent, mockBody, verifyJwtMock, authMock, repo } from "test/utils";

describe("/tag", () => {
  it("should list all tags", async () => {
    const authId = "test-user-1";

    await repo().insert(user).values({
      authId,
    });

    console.log(test);

    verifyJwtMock.mockImplementation(() => authMock(authId));

    await repo().insert(tag).values({
      name: "Test tag",
      background: "#4287F5",
      userId: 1,
    });

    const allTags = await agent.request("/tag");

    console.log(await allTags.json());

    // console.log(await allTags.json());

    expect(allTags.status).toBe(200);
  });

  it("should create a tag", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const allTags = await agent.request("/tag", {
      method: "POST",
      body: mockBody({
        name: "Test Tag",
        background: "#4287F5",
      }),
    });

    console.log("test");

    expect(allTags.status).toBe(200);
  });
});
