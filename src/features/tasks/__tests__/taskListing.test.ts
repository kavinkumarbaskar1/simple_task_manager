import { beforeEach, describe, expect, it } from "vitest";

import { completeTask, createTask, listTasks } from "../taskController";

describe("task listing", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("lists all stored tasks across statuses", () => {
    const firstTask = createTask({
      title: "Write release notes",
      dueDate: "2026-11-20",
      priority: "Medium",
    });
    const secondTask = createTask({
      title: "Review design handoff",
      dueDate: "2026-11-18",
      priority: "High",
    });

    expect(firstTask.ok).toBe(true);
    expect(secondTask.ok).toBe(true);

    if (!firstTask.ok) {
      return;
    }

    const completedTask = completeTask(firstTask.data.id);
    expect(completedTask.ok).toBe(true);

    const listedTasks = listTasks();
    expect(listedTasks.ok).toBe(true);

    if (listedTasks.ok) {
      expect(listedTasks.data).toHaveLength(2);
      expect(listedTasks.data.map((task) => task.title)).toEqual([
        "Review design handoff",
        "Write release notes",
      ]);
      expect(listedTasks.data.map((task) => task.status)).toEqual(["Pending", "Completed"]);
    }
  });

  it("orders listed tasks by ascending due date", () => {
    createTask({
      title: "Later task",
      dueDate: "2026-12-05",
      priority: "Low",
    });
    createTask({
      title: "Earliest task",
      dueDate: "2026-11-12",
      priority: "High",
    });
    createTask({
      title: "Middle task",
      dueDate: "2026-11-21",
      priority: "Medium",
    });

    const listedTasks = listTasks();
    expect(listedTasks.ok).toBe(true);

    if (listedTasks.ok) {
      expect(listedTasks.data.map((task) => task.dueDate)).toEqual([
        "2026-11-12",
        "2026-11-21",
        "2026-12-05",
      ]);
      expect(listedTasks.data.map((task) => task.title)).toEqual([
        "Earliest task",
        "Middle task",
        "Later task",
      ]);
    }
  });
});
