import { beforeEach, describe, expect, it } from "vitest";

import { getTasks, patchTaskComplete, postTask } from "../../../services/tasks/taskService";

describe("task status filtering", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("lists all tasks across pending and completed statuses in due date order", () => {
    const completedTask = createStoredTask("Completed task due second", "2026-11-20", "High");
    createStoredTask("Pending task due first", "2026-11-18", "Medium");
    createStoredTask("Pending task due last", "2026-11-22", "Low");

    const completedResult = patchTaskComplete(completedTask.id);
    expect(completedResult.ok).toBe(true);

    const response = getTasks();

    expect(response.ok).toBe(true);
    expect(response.method).toBe("GET");
    expect(response.route).toBe("/tasks");

    if (response.ok) {
      expect(response.data.map((task) => task.title)).toEqual([
        "Pending task due first",
        "Completed task due second",
        "Pending task due last",
      ]);
      expect(response.data.map((task) => task.status)).toEqual([
        "Pending",
        "Completed",
        "Pending",
      ]);
    }
  });

  it("lists only pending tasks with the Pending status query", () => {
    const completedTask = createStoredTask("Completed filtered out", "2026-11-18", "Medium");
    createStoredTask("Pending due first", "2026-11-16", "Low");
    createStoredTask("Pending due second", "2026-11-20", "High");

    const completedResult = patchTaskComplete(completedTask.id);
    expect(completedResult.ok).toBe(true);

    const response = getTasks({ status: "Pending" });

    expect(response.ok).toBe(true);
    expect(response.route).toBe("/tasks?status=Pending");

    if (response.ok) {
      expect(response.data.map((task) => task.title)).toEqual([
        "Pending due first",
        "Pending due second",
      ]);
      expect(response.data.every((task) => task.status === "Pending")).toBe(true);
    }
  });

  it("lists only completed tasks with the Completed status query", () => {
    const completedLater = createStoredTask("Completed due second", "2026-11-21", "High");
    const completedEarlier = createStoredTask("Completed due first", "2026-11-17", "Medium");
    createStoredTask("Pending filtered out", "2026-11-15", "Low");

    expect(patchTaskComplete(completedLater.id).ok).toBe(true);
    expect(patchTaskComplete(completedEarlier.id).ok).toBe(true);

    const response = getTasks({ status: "Completed" });

    expect(response.ok).toBe(true);
    expect(response.route).toBe("/tasks?status=Completed");

    if (response.ok) {
      expect(response.data.map((task) => task.title)).toEqual([
        "Completed due first",
        "Completed due second",
      ]);
      expect(response.data.every((task) => task.status === "Completed")).toBe(true);
    }
  });
});

function createStoredTask(
  title: string,
  dueDate: string,
  priority: "Low" | "Medium" | "High",
) {
  const response = postTask({ title, dueDate, priority });

  if (!response.ok) {
    throw new Error(`Expected task "${title}" to be created.`);
  }

  return response.data;
}
