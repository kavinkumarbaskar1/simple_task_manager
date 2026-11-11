import { beforeEach, describe, expect, it } from "vitest";

import { completeTask, createTask, findTask, listTasks, updateTask } from "../taskController";

describe("task editing", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("updates editable task fields while preserving the stored status", () => {
    const createdTask = createTask({
      title: "Draft onboarding notes",
      description: "Collect the current handoff gaps.",
      dueDate: "2026-11-18",
      priority: "Medium",
    });

    expect(createdTask.ok).toBe(true);

    if (!createdTask.ok) {
      return;
    }

    const completedTask = completeTask(createdTask.data.id);
    expect(completedTask.ok).toBe(true);

    const updatedTask = updateTask(createdTask.data.id, {
      title: "Publish onboarding notes",
      description: "Share the final handoff checklist.",
      dueDate: "2026-11-21",
      priority: "High",
      status: "Pending",
    });

    expect(updatedTask.ok).toBe(true);

    if (!updatedTask.ok) {
      return;
    }

    expect(updatedTask.data).toEqual({
      id: createdTask.data.id,
      title: "Publish onboarding notes",
      description: "Share the final handoff checklist.",
      dueDate: "2026-11-21",
      priority: "High",
      status: "Completed",
    });

    const listedTasks = listTasks();
    expect(listedTasks.ok).toBe(true);

    if (listedTasks.ok) {
      expect(listedTasks.data).toEqual([updatedTask.data]);
    }
  });

  it("returns validation failure and keeps stored task values when required fields are missing", () => {
    const createdTask = createTask({
      title: "Confirm invoice details",
      description: "Check due date and recipient.",
      dueDate: "2026-11-19",
      priority: "Low",
    });

    expect(createdTask.ok).toBe(true);

    if (!createdTask.ok) {
      return;
    }

    const updatedTask = updateTask(createdTask.data.id, {
      title: " ",
      description: "This should not be saved.",
      dueDate: "2026-11-24",
      priority: "High",
      status: "Pending",
    });

    expect(updatedTask.ok).toBe(false);

    if (!updatedTask.ok) {
      expect(updatedTask.error.code).toBe("validation_failed");
      expect(updatedTask.error.fieldErrors).toEqual([
        { field: "title", message: "Title is required." },
      ]);
    }

    const storedTask = findTask(createdTask.data.id);
    expect(storedTask.ok).toBe(true);

    if (storedTask.ok) {
      expect(storedTask.data).toEqual(createdTask.data);
    }
  });

  it("returns not-found when updating an unknown task ID", () => {
    const updatedTask = updateTask("missing-task", {
      title: "Unknown task",
      description: "This task does not exist.",
      dueDate: "2026-11-22",
      priority: "Medium",
      status: "Pending",
    });

    expect(updatedTask.ok).toBe(false);

    if (!updatedTask.ok) {
      expect(updatedTask.error.code).toBe("not_found");
      expect(updatedTask.error.message).toBe("Task was not found.");
    }
  });
});
