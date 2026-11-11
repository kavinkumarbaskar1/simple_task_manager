import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Task } from "../../domain/tasks/taskTypes";
import {
  clearTasksFromStorage,
  readTasksFromStorage,
  taskStorageKey,
  writeTasksToStorage,
} from "../localTaskStorage";

describe("local task storage persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("serializes task collections into localStorage", () => {
    const tasks = [buildTask("task-1"), buildTask("task-2", "Completed")];

    const result = writeTasksToStorage(tasks);

    expect(result.ok).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(taskStorageKey) ?? "[]")).toEqual(tasks);
  });

  it("deserializes task collections from localStorage", () => {
    const tasks = [
      buildTask("task-1", "Pending", "Stored description"),
      buildTask("task-2", "Completed"),
    ];
    window.localStorage.setItem(taskStorageKey, JSON.stringify(tasks));

    const result = readTasksFromStorage();

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data).toEqual(tasks);
    }
  });

  it("returns an empty collection when no tasks have been stored", () => {
    const result = readTasksFromStorage();

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("reports invalid saved task data", () => {
    window.localStorage.setItem(taskStorageKey, JSON.stringify([{ id: "task-1" }]));

    const result = readTasksFromStorage();

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe("invalid_data");
      expect(result.error.message).toBe("Saved tasks could not be read.");
    }
  });

  it("reports read, write, and clear storage failures", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("read blocked");
    });

    const readResult = readTasksFromStorage();
    expect(readResult.ok).toBe(false);

    if (!readResult.ok) {
      expect(readResult.error.code).toBe("read_failed");
    }

    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("write blocked");
    });

    const writeResult = writeTasksToStorage([buildTask("task-1")]);
    expect(writeResult.ok).toBe(false);

    if (!writeResult.ok) {
      expect(writeResult.error.code).toBe("write_failed");
    }

    vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(() => {
      throw new Error("clear blocked");
    });

    const clearResult = clearTasksFromStorage();
    expect(clearResult.ok).toBe(false);

    if (!clearResult.ok) {
      expect(clearResult.error.code).toBe("clear_failed");
    }
  });
});

function buildTask(
  id: string,
  status: Task["status"] = "Pending",
  description = `${id} description`,
): Task {
  return {
    id,
    title: `${id} title`,
    description,
    dueDate: "2026-11-20",
    priority: "Medium",
    status,
  };
}
