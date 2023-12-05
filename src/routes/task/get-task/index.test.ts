import { Task, task, user } from "data/schema";
import {
  agentRequest,
  authMock,
  getInsertId,
  it,
  repo,
  verifyJwtMock,
} from "test/utils";
import { GetTaskResponse } from "./types";
import { ResponseStatus } from "config/types";
import { entityManager } from "data";
import GetTask from ".";

describe("GET /:taskId", () => {
  it("should successfully return a task by its ID", async () => {
    const authId = "test-user-1";

    const userEntity = await repo().insert(user).values({
      authId,
    });

    verifyJwtMock.mockImplementation(() => authMock(authId));

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

    const newTask = await repo().insert(task).values(taskBody);

    const existingTask = await agentRequest<GetTaskResponse>(
      `/task/${getInsertId(newTask)}`
    );

    const { meta, data } = existingTask;

    expect(meta.status).toBe(ResponseStatus.SUCCCESS);
    expect(meta.code).toBe(200);

    expect(data).toMatchObject({
      id: getInsertId(newTask),
      title: taskBody.title,
      description: taskBody.description,
      dueAt: taskBody.dueAt,
      priority: taskBody.priority,
      done: taskBody.done,
      createdAt: taskBody.createdAt.toISOString(),
      updatedAt: taskBody.updatedAt.toISOString(),
      tags: [],
    });
  });

  it("should return 404 when task is not found", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const existingTask = await agentRequest<GetTaskResponse>(`/task/1000`);

    const { meta } = existingTask;

    expect(meta).toMatchObject({
      code: 404,
      data: "Task not found",
      status: "error",
    });
  });

  it("should not return another user's task", async () => {
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

    const newTask = await repo().insert(task).values(taskBody);

    const existingTaskResponse = await agentRequest<GetTaskResponse>(
      `/task/${getInsertId(newTask)}`
    );

    const { meta } = existingTaskResponse;

    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(meta.code).toBe(403);
  });

  it("should not accept a non-numeric task ID", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const existingTaskResponse = await agentRequest<GetTaskResponse>(
      `/task/test`
    );

    const { meta } = existingTaskResponse;

    const invalidPatternRequirement = {
      instancePath: "/taskId",
      schemaPath: "#/properties/taskId/pattern",
      keyword: "pattern",
      params: { pattern: "^[0-9]+$" },
      message: 'must match pattern "^[0-9]+$"',
    };

    expect(meta).toMatchObject({
      code: 400,
      data: [invalidPatternRequirement],
      status: "error",
    });
  });

  it("should return 401 for an unauthorised user", async () => {
    verifyJwtMock.mockImplementation(async () => ({
      isError: true,
      code: 403,
      data: null,
    }));

    const existingTaskResponse = await agentRequest<GetTaskResponse>(`/task/1`);

    const { meta } = existingTaskResponse;

    expect(meta.code).toBe(401);
    expect(meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should return 403 if user verification is bypassed", async () => {
    const repo = entityManager.getTransaction();

    expect(repo).not.toBeNull();

    if (repo === null) {
      return;
    }

    const getTaskResponse = await GetTask({
      body: {},
      params: {
        taskId: "1",
      },
      query: {},
      auth: null,
      repo,
    });

    const { isError, code, data } = getTaskResponse;

    expect(isError).toBe(true);
    expect(code).toBe(403);
    expect(data).toBe("Unauthorised");
  });
});
