import { beforeEach, describe, expect, it } from "vitest";

import {
  completeTask,
  createTask,
  listTasks,
  loadPersistedTasks,
  removeTask,
  updateTask,
} from "../taskController";

describe("task persistence workflows", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps created tasks after a reload simulation", () => {
    const createdTask = createPersistedTask("Persist created task", "2026-11-20", "High");

    const tasksAfterReload = loadPersistedTasks();

    expect(tasksAfterReload.ok).toBe(true);

    if (tasksAfterReload.ok) {
      expect(tasksAfterReload.data).toEqual([createdTask]);
    }
  });

  it("keeps edited task fields after a reload simulation", () => {
    const createdTask = createPersistedTask("Persist editable task", "2026-11-20", "Medium");

    const updatedTask = updateTask(createdTask.id, {
      title: "Persist edited task",
      description: "Edited details should survive refresh.",
      dueDate: "2026-11-25",
      priority: "High",
      status: "Pending",
    });

    expect(updatedTask.ok).toBe(true);

    if (!updatedTask.ok) {
      return;
    }

    const tasksAfterReload = loadPersistedTasks();

    expect(tasksAfterReload.ok).toBe(true);

    if (tasksAfterReload.ok) {
      expect(tasksAfterReload.data).toEqual([updatedTask.data]);
    }
  });

  it("keeps completed status after a reload simulation", () => {
    const createdTask = createPersistedTask("Persist completed task", "2026-11-20", "Low");

    const completedTask = completeTask(createdTask.id);

    expect(completedTask.ok).toBe(true);

    if (!completedTask.ok) {
      return;
    }

    const tasksAfterReload = loadPersistedTasks();

    expect(tasksAfterReload.ok).toBe(true);

    if (tasksAfterReload.ok) {
      expect(tasksAfterReload.data).toEqual([completedTask.data]);
      expect(tasksAfterReload.data[0].status).toBe("Completed");
    }
  });

  it("keeps deleted tasks absent after a reload simulation", () => {
    const deletedTask = createPersistedTask("Persist deleted task", "2026-11-22", "Low");
    const preservedTask = createPersistedTask("Persist preserved task", "2026-11-21", "High");

    const deleteResult = removeTask(deletedTask.id);

    expect(deleteResult.ok).toBe(true);

    const tasksAfterReload = loadPersistedTasks();

    expect(tasksAfterReload.ok).toBe(true);

    if (tasksAfterReload.ok) {
      expect(tasksAfterReload.data).toEqual([preservedTask]);
      expect(tasksAfterReload.data).not.toContainEqual(deletedTask);
    }
  });

  it("returns persisted task lists through the dashboard initialization controller path", () => {
    const laterTask = createPersistedTask("Load later task", "2026-11-26", "Medium");
    const earlierTask = createPersistedTask("Load earlier task", "2026-11-19", "High");

    const initializedTasks = loadPersistedTasks();

    expect(initializedTasks.ok).toBe(true);

    if (initializedTasks.ok) {
      expect(initializedTasks.data).toEqual([earlierTask, laterTask]);
    }
  });

  it("returns a storage error when persisted data cannot be read", () => {
    window.localStorage.setItem("simple-task-management:tasks", "{not valid JSON");

    const result = listTasks();

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe("read_failed");
      expect(result.error.message).toBe("Saved tasks could not be read.");
    }
  });
});

function createPersistedTask(
  title: string,
  dueDate: string,
  priority: "Low" | "Medium" | "High",
) {
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
