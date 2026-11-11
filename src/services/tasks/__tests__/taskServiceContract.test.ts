import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Task, TaskPriority } from "../../../domain/tasks/taskTypes";
import { taskStorageKey } from "../../../storage/localTaskStorage";
import {
  deleteTask,
  getTask,
  getTasks,
  patchTaskComplete,
  postTask,
  putTask,
} from "../taskService";
import { taskServiceRoutes } from "../taskServiceContract";

describe("REST-like task service contract", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates a task with POST /tasks and returns the created task data", () => {
    const response = postTask({
      title: " Draft release checklist ",
      description: " Confirm launch readiness. ",
      dueDate: "2026-11-20",
      priority: "High",
    });

    expect(response.ok).toBe(true);
    expect(response.method).toBe(taskServiceRoutes.create.method);
    expect(response.route).toBe(taskServiceRoutes.create.path);
    expect(response.status).toBe(201);

    if (response.ok) {
      expect(response.data).toEqual({
        id: expect.any(String),
        title: "Draft release checklist",
        description: "Confirm launch readiness.",
        dueDate: "2026-11-20",
        priority: "High",
        status: "Pending",
      });
    }
  });

  it("lists all tasks with GET /tasks when no status filter is provided", () => {
    createContractTask("Pending task due later", "2026-11-22", "Medium");
    const completedTask = createContractTask("Completed task due first", "2026-11-18", "High");
    expect(patchTaskComplete(completedTask.id).ok).toBe(true);

    const response = getTasks();

    expect(response.ok).toBe(true);
    expect(response.method).toBe(taskServiceRoutes.list.method);
    expect(response.route).toBe("/tasks");
    expect(response.status).toBe(200);

    if (response.ok) {
      expect(response.data.map((task) => task.title)).toEqual([
        "Completed task due first",
        "Pending task due later",
      ]);
      expect(response.data.map((task) => task.status)).toEqual(["Completed", "Pending"]);
    }
  });

  it("filters GET /tasks results by Pending or Completed status", () => {
    const completedTask = createContractTask("Completed filter match", "2026-11-19", "High");
    createContractTask("Pending filter match", "2026-11-17", "Low");
    createContractTask("Pending filter match later", "2026-11-24", "Medium");
    expect(patchTaskComplete(completedTask.id).ok).toBe(true);

    const pendingResponse = getTasks({ status: "Pending" });
    const completedResponse = getTasks({ status: "Completed" });

    expect(pendingResponse.ok).toBe(true);
    expect(pendingResponse.route).toBe("/tasks?status=Pending");
    expect(completedResponse.ok).toBe(true);
    expect(completedResponse.route).toBe("/tasks?status=Completed");

    if (pendingResponse.ok) {
      expect(pendingResponse.data.map((task) => task.title)).toEqual([
        "Pending filter match",
        "Pending filter match later",
      ]);
      expect(pendingResponse.data.every((task) => task.status === "Pending")).toBe(true);
    }

    if (completedResponse.ok) {
      expect(completedResponse.data.map((task) => task.title)).toEqual(["Completed filter match"]);
      expect(completedResponse.data[0]?.id).toBe(completedTask.id);
      expect(completedResponse.data.every((task) => task.status === "Completed")).toBe(true);
    }
  });

  it("updates a task with PUT /tasks/{id} and returns the updated task data", () => {
    const createdTask = createContractTask("Initial title", "2026-11-21", "Low");

    const response = putTask(createdTask.id, {
      title: "Updated title",
      description: "Updated details",
      dueDate: "2026-11-23",
      priority: "High",
      status: "Completed",
    });

    expect(response.ok).toBe(true);
    expect(response.method).toBe(taskServiceRoutes.update.method);
    expect(response.route).toBe(`/tasks/${createdTask.id}`);
    expect(response.status).toBe(200);

    if (response.ok) {
      expect(response.data).toEqual({
        id: createdTask.id,
        title: "Updated title",
        description: "Updated details",
        dueDate: "2026-11-23",
        priority: "High",
        status: "Pending",
      });
    }
  });

  it("deletes a task with DELETE /tasks/{id} and removes it from subsequent retrieval", () => {
    const createdTask = createContractTask("Delete me", "2026-11-25", "Medium");

    const deleteResponse = deleteTask(createdTask.id);
    const readResponse = getTask(createdTask.id);
    const listResponse = getTasks();

    expect(deleteResponse.ok).toBe(true);
    expect(deleteResponse.method).toBe(taskServiceRoutes.delete.method);
    expect(deleteResponse.route).toBe(`/tasks/${createdTask.id}`);
    expect(deleteResponse.status).toBe(204);

    if (deleteResponse.ok) {
      expect(deleteResponse.data).toBeNull();
    }

    expect(readResponse.ok).toBe(false);
    expect(readResponse.status).toBe(404);

    if (!readResponse.ok) {
      expect(readResponse.error.code).toBe("not_found");
    }

    expect(listResponse.ok).toBe(true);

    if (listResponse.ok) {
      expect(listResponse.data).toEqual([]);
    }
  });

  it("performs contract operations without authentication setup or network calls", () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("Network calls are not allowed.")));
    const xhrOpenSpy = vi.spyOn(XMLHttpRequest.prototype, "open");
    const xhrSendSpy = vi.spyOn(XMLHttpRequest.prototype, "send");
    vi.stubGlobal("fetch", fetchSpy);

    expect(window.localStorage.getItem("authToken")).toBeNull();
    expect(window.localStorage.getItem("sessionToken")).toBeNull();
    expect(window.localStorage.getItem("accessToken")).toBeNull();

    const createdTask = createContractTask("Local-only contract task", "2026-11-26", "Low");
    const readResponse = getTask(createdTask.id);
    const updateResponse = putTask(createdTask.id, {
      title: "Local-only updated task",
      description: "Still stored locally",
      dueDate: "2026-11-27",
      priority: "Medium",
      status: "Pending",
    });
    const completeResponse = patchTaskComplete(createdTask.id);
    const deleteResponse = deleteTask(createdTask.id);

    expect(readResponse.ok).toBe(true);
    expect(updateResponse.ok).toBe(true);
    expect(completeResponse.ok).toBe(true);
    expect(deleteResponse.ok).toBe(true);
    expect(window.localStorage.getItem(taskStorageKey)).not.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrOpenSpy).not.toHaveBeenCalled();
    expect(xhrSendSpy).not.toHaveBeenCalled();
  });
});

function createContractTask(title: string, dueDate: string, priority: TaskPriority): Task {
  const response = postTask({ title, dueDate, priority });

  if (!response.ok) {
    throw new Error(`Expected contract test task "${title}" to be created.`);
  }

  return response.data;
}
