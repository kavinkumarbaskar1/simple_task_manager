import { beforeEach, describe, expect, it } from "vitest";

import { createTask, findTask, listTasks, removeTask } from "../taskController";

describe("task deletion", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("removes an existing task from list results while preserving unrelated tasks", () => {
    const firstTask = seedTask("Draft deletion notes", "2026-11-18", "High");
    const secondTask = seedTask("Keep planning task", "2026-11-20", "Medium");

    const deletedTask = removeTask(firstTask.id);

    expect(deletedTask.ok).toBe(true);

    const listedTasks = listTasks();
    expect(listedTasks.ok).toBe(true);

    if (listedTasks.ok) {
      expect(listedTasks.data).toHaveLength(1);
      expect(listedTasks.data).toEqual([secondTask]);
      expect(listedTasks.data.some((task) => task.id === firstTask.id)).toBe(false);
    }

    const removedLookup = findTask(firstTask.id);
    expect(removedLookup.ok).toBe(false);

    if (!removedLookup.ok) {
      expect(removedLookup.error.code).toBe("not_found");
    }
  });

  it("returns not-found when deleting an unknown task ID", () => {
    const deletedTask = removeTask("missing-task");

    expect(deletedTask.ok).toBe(false);

    if (!deletedTask.ok) {
      expect(deletedTask.error.code).toBe("not_found");
      expect(deletedTask.error.message).toBe("Task was not found.");
    }
  });

  it("keeps a deleted task absent from localStorage-backed state after a reload simulation", () => {
    const deletedCandidate = seedTask("Remove stale follow-up", "2026-11-21", "Low");
    const preservedTask = seedTask("Preserve active follow-up", "2026-11-22", "High");

    const deletedTask = removeTask(deletedCandidate.id);
    expect(deletedTask.ok).toBe(true);

    const tasksAfterReload = listTasks();
    expect(tasksAfterReload.ok).toBe(true);

    if (tasksAfterReload.ok) {
      expect(tasksAfterReload.data).toHaveLength(1);
      expect(tasksAfterReload.data).toEqual([preservedTask]);
      expect(tasksAfterReload.data.find((task) => task.id === deletedCandidate.id)).toBeUndefined();
    }
  });
});

function seedTask(title: string, dueDate: string, priority: "High" | "Medium" | "Low") {
  const createdTask = createTask({
    title,
    description: `${title} description`,
    dueDate,
    priority,
  });

  if (!createdTask.ok) {
    throw new Error(`Expected ${title} to be created.`);
  }

  return createdTask.data;
}
