import { user, Task, task } from "data/schema";
import {
  agentRequest,
  authMock,
  getInsertId,
  it,
  repo,
  verifyJwtMock,
} from "test/utils";
import { ListTasksResponse } from "./types";
import { ResponseStatus } from "config/types";
import { entityManager } from "data";
import ListTasks from ".";

describe("GET /task", () => {
  it("should list all tasks for a user", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const taskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: null,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(taskBody);

    const listTaskResponse = await agentRequest<ListTasksResponse>(`/task`, {
      method: "GET",
    });

    const { meta, data } = listTaskResponse;

    expect(meta.code).toBe(200);
    expect(meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(data).toHaveLength(1);
    expect(data).toMatchObject([
      {
        title: taskBody.title,
        description: taskBody.description,
        dueAt: taskBody.dueAt,
        priority: taskBody.priority,
        done: taskBody.done,
        tags: [],
        createdAt: taskBody.createdAt.toISOString(),
        updatedAt: taskBody.updatedAt.toISOString(),
      },
    ]);
  });

  it("should not list other user's tasks", async () => {
    const primaryUser = "test-user-1";
    const secondaryUser = "test-user-2";

    verifyJwtMock.mockImplementation(() => authMock(primaryUser));

    const secondaryUserEntity = await repo().insert(user).values({
      authId: secondaryUser,
    });

    const now = new Date();

    const taskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: null,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(secondaryUserEntity),
    };

    await repo().insert(task).values(taskBody);

    const listTaskResponse = await agentRequest<ListTasksResponse>(`/task`, {
      method: "GET",
    });

    expect(listTaskResponse.meta.code).toBe(200);
    expect(listTaskResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(listTaskResponse.data).toHaveLength(0);
    expect(listTaskResponse.data).toMatchObject([]);
  });

  it("should return latest due by default", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const firstTaskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: oneYearAgo,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(firstTaskBody);

    const secondTaskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(secondTaskBody);

    const listTaskResponse = await agentRequest<ListTasksResponse>(`/task`, {
      method: "GET",
    });

    expect(listTaskResponse.meta.code).toBe(200);
    expect(listTaskResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(listTaskResponse.data).toHaveLength(2);
    expect(listTaskResponse.data).toMatchObject([
      {
        dueAt: now.toISOString(),
      },
      {
        dueAt: oneYearAgo.toISOString(),
      },
    ]);
  });

  it("should return latest due task first if sorted by dueAt DESC", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const firstTaskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(firstTaskBody);

    const oneYearAgo = new Date();

    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const secondTaskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: oneYearAgo,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(secondTaskBody);

    const params = new URLSearchParams({
      sortColumn: "dueAt",
      sortOrder: "DESC",
    });

    const listTaskResponse = await agentRequest<ListTasksResponse>(
      `/task?${params.toString()}`,
      {
        method: "GET",
      }
    );

    expect(listTaskResponse.meta.code).toBe(200);
    expect(listTaskResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(listTaskResponse.data).toHaveLength(2);
    expect(listTaskResponse.data).toMatchObject([
      {
        dueAt: now.toISOString(),
      },
      {
        dueAt: oneYearAgo.toISOString(),
      },
    ]);
  });

  it("should return oldest due task first if sorted by dueAt ASC", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const firstTaskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(firstTaskBody);

    const oneYearAgo = new Date();

    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const secondTaskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: oneYearAgo,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(secondTaskBody);

    const params = new URLSearchParams({
      sortColumn: "dueAt",
      sortOrder: "ASC",
    });

    const listTaskResponse = await agentRequest<ListTasksResponse>(
      `/task?${params.toString()}`,
      {
        method: "GET",
      }
    );

    expect(listTaskResponse.meta.code).toBe(200);
    expect(listTaskResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(listTaskResponse.data).toHaveLength(2);
    expect(listTaskResponse.data).toMatchObject([
      {
        dueAt: oneYearAgo.toISOString(),
      },
      {
        dueAt: now.toISOString(),
      },
    ]);
  });

  it("should only return tasks with priority 1 when filtered", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const firstTaskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(firstTaskBody);

    const secondTaskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: now,
      priority: 2,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(secondTaskBody);

    const params = new URLSearchParams({
      priority: "1",
    });

    const listTaskResponse = await agentRequest<ListTasksResponse>(
      `/task?${params.toString()}`,
      {
        method: "GET",
      }
    );

    expect(listTaskResponse.meta.code).toBe(200);
    expect(listTaskResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(listTaskResponse.data).toHaveLength(1);
    expect(listTaskResponse.data).toMatchObject([
      {
        priority: 1,
      },
    ]);
  });

  it("should only return complete tasks when filtered by 'done'", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const firstTaskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: true,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(firstTaskBody);

    const secondTaskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: now,
      priority: 2,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(secondTaskBody);

    const params = new URLSearchParams({
      done: "1",
    });

    const listTaskResponse = await agentRequest<ListTasksResponse>(
      `/task?${params.toString()}`,
      {
        method: "GET",
      }
    );

    expect(listTaskResponse.meta.code).toBe(200);
    expect(listTaskResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(listTaskResponse.data).toHaveLength(1);
    expect(listTaskResponse.data).toMatchObject([
      {
        done: true,
      },
    ]);
  });

  it("should only return incomplete tasks when filtered by 'done'", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const firstTaskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: true,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(firstTaskBody);

    const secondTaskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: now,
      priority: 2,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(secondTaskBody);

    const params = new URLSearchParams({
      done: "0",
    });

    const listTaskResponse = await agentRequest<ListTasksResponse>(
      `/task?${params.toString()}`,
      {
        method: "GET",
      }
    );

    expect(listTaskResponse.meta.code).toBe(200);
    expect(listTaskResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(listTaskResponse.data).toHaveLength(1);
    expect(listTaskResponse.data).toMatchObject([
      {
        done: false,
      },
    ]);
  });

  it("should returned search results by full title", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const firstTaskBody: Omit<Task, "id"> = {
      title: "Interesting title",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: true,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(firstTaskBody);

    const secondTaskBody: Omit<Task, "id"> = {
      title: "Test title",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(secondTaskBody);

    const queryBody = {
      title: "Interesting title",
    };

    const params = new URLSearchParams(queryBody);

    const listTaskResponse = await agentRequest<ListTasksResponse>(
      `/task?${params.toString()}`,
      {
        method: "GET",
      }
    );

    expect(listTaskResponse.meta.code).toBe(200);
    expect(listTaskResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(listTaskResponse.data).toHaveLength(1);
    expect(listTaskResponse.data).toMatchObject([queryBody]);
  });

  it("should returned search results by partial title", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const firstTaskBody: Omit<Task, "id"> = {
      title: "Interesting title",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: true,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(firstTaskBody);

    const secondTaskBody: Omit<Task, "id"> = {
      title: "Test title",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(secondTaskBody);

    const queryBody = {
      title: "title",
    };

    const params = new URLSearchParams(queryBody);

    const listTaskResponse = await agentRequest<ListTasksResponse>(
      `/task?${params.toString()}`,
      {
        method: "GET",
      }
    );

    expect(listTaskResponse.meta.code).toBe(200);
    expect(listTaskResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(listTaskResponse.data).toHaveLength(2);
    expect(listTaskResponse.data).toMatchObject([
      {
        title: firstTaskBody.title,
      },
      {
        title: secondTaskBody.title,
      },
    ]);
  });

  it("should returned search results by title, case insensitive", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const firstTaskBody: Omit<Task, "id"> = {
      title: "Interesting",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: true,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(firstTaskBody);

    const secondTaskBody: Omit<Task, "id"> = {
      title: "interesting",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(secondTaskBody);

    const queryBody = {
      title: "interesting",
    };

    const params = new URLSearchParams(queryBody);

    const listTaskResponse = await agentRequest<ListTasksResponse>(
      `/task?${params.toString()}`,
      {
        method: "GET",
      }
    );

    expect(listTaskResponse.meta.code).toBe(200);
    expect(listTaskResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(listTaskResponse.data).toHaveLength(2);
    expect(listTaskResponse.data).toMatchObject([
      {
        title: firstTaskBody.title,
      },
      {
        title: secondTaskBody.title,
      },
    ]);
  });

  it("should return no results if task with title does not exist", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const firstTaskBody: Omit<Task, "id"> = {
      title: "Interesting title",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: true,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(firstTaskBody);

    const secondTaskBody: Omit<Task, "id"> = {
      title: "Test title",
      description: "Test description",
      dueAt: now,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(secondTaskBody);

    const queryBody = {
      title: "another",
    };

    const params = new URLSearchParams(queryBody);

    const listTaskResponse = await agentRequest<ListTasksResponse>(
      `/task?${params.toString()}`,
      {
        method: "GET",
      }
    );

    expect(listTaskResponse.meta.code).toBe(200);
    expect(listTaskResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(listTaskResponse.data).toHaveLength(0);
    expect(listTaskResponse.data).toMatchObject([]);
  });

  it("should return 401 for an unauthorised user", async () => {
    verifyJwtMock.mockImplementation(async () => ({
      isError: true,
      code: 403,
      data: null,
    }));

    const userEntity = await repo().insert(user).values({
      authId: "test-user-1",
    });

    const now = new Date();

    const taskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: null,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(task).values(taskBody);

    const listTaskResponse = await agentRequest<ListTasksResponse>(`/task`, {
      method: "GET",
    });

    expect(listTaskResponse.meta.code).toBe(401);
    expect(listTaskResponse.meta.status).toBe(ResponseStatus.ERROR);
    expect(listTaskResponse.data).toBeUndefined();
  });

  it("should return 403 if user verification is bypassed", async () => {
    const repo = entityManager.getTransaction();

    expect(repo).not.toBeNull();

    if (repo === null) {
      return;
    }

    const listTasksResponse = await ListTasks({
      body: {},
      params: {},
      query: {},
      auth: null,
      repo,
    });

    const { isError, code, data } = listTasksResponse;

    expect(isError).toBe(true);
    expect(code).toBe(403);
    expect(data).toBe("Unauthorised");
  });
});
