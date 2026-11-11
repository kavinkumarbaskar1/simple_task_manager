import { beforeEach, describe, expect, it } from "vitest";

import { createTask, completeTask, findTask, listTasks } from "../taskController";

describe("task completion", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("changes a pending task to completed and persists the completed status", () => {
    const createdTask = createTask({
      title: "Reconcile sprint board",
      description: "Confirm each open item has an owner.",
      dueDate: "2026-11-20",
      priority: "High",
    });

    expect(createdTask.ok).toBe(true);

    if (!createdTask.ok) {
      return;
    }

    expect(createdTask.data.status).toBe("Pending");

    const completedTask = completeTask(createdTask.data.id);

    expect(completedTask.ok).toBe(true);

    if (!completedTask.ok) {
      return;
    }

    expect(completedTask.data).toEqual({
      ...createdTask.data,
      status: "Completed",
    });

    const storedTask = findTask(createdTask.data.id);
    expect(storedTask.ok).toBe(true);

    if (storedTask.ok) {
      expect(storedTask.data.status).toBe("Completed");
    }
  });

  it("keeps an already completed task completed without changing other fields", () => {
    const createdTask = createTask({
      title: "Send release notes",
      description: "Include support handoff details.",
      dueDate: "2026-11-22",
      priority: "Medium",
    });

    expect(createdTask.ok).toBe(true);

    if (!createdTask.ok) {
      return;
    }

    const firstCompletion = completeTask(createdTask.data.id);
    expect(firstCompletion.ok).toBe(true);

    if (!firstCompletion.ok) {
      return;
    }

    const repeatedCompletion = completeTask(createdTask.data.id);
    expect(repeatedCompletion.ok).toBe(true);

    if (!repeatedCompletion.ok) {
      return;
    }

    expect(repeatedCompletion.data).toEqual(firstCompletion.data);
    expect(repeatedCompletion.data).toEqual({
      ...createdTask.data,
      status: "Completed",
    });
  });

  it("reads completed status from localStorage-backed state after a reload simulation", () => {
    const createdTask = createTask({
      title: "Archive planning notes",
      description: "Move final notes to the shared folder.",
      dueDate: "2026-11-24",
      priority: "Low",
    });

    expect(createdTask.ok).toBe(true);

    if (!createdTask.ok) {
      return;
    }

    const completedTask = completeTask(createdTask.data.id);
    expect(completedTask.ok).toBe(true);

    const tasksAfterReload = listTasks();
    expect(tasksAfterReload.ok).toBe(true);

    if (tasksAfterReload.ok) {
      expect(tasksAfterReload.data).toHaveLength(1);
      expect(tasksAfterReload.data[0]).toEqual({
        ...createdTask.data,
        status: "Completed",
      });
    }
  });
});
