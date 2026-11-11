import { beforeEach, describe, expect, it } from "vitest";

import { listTasks, createTask } from "../taskController";
import type { TaskCreateInput } from "../../../services/tasks/taskService";

describe("task creation", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("creates a pending task with required fields and an optional description", () => {
    const result = createTask({
      title: "Prepare launch checklist",
      description: "Confirm release steps with the team.",
      dueDate: "2026-11-20",
      priority: "High",
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.data).toEqual({
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      title: "Prepare launch checklist",
      description: "Confirm release steps with the team.",
      dueDate: "2026-11-20",
      priority: "High",
      status: "Pending",
    });

    const tasks = listTasks();
    expect(tasks.ok).toBe(true);

    if (tasks.ok) {
      expect(tasks.data).toHaveLength(1);
      expect(tasks.data[0]).toEqual(result.data);
    }
  });

  it("creates a task when description is empty", () => {
    const result = createTask({
      title: "Schedule planning session",
      description: "",
      dueDate: "2026-11-18",
      priority: "Medium",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.description).toBeUndefined();
      expect(result.data.status).toBe("Pending");
    }

    const tasks = listTasks();
    expect(tasks.ok).toBe(true);

    if (tasks.ok) {
      expect(tasks.data).toHaveLength(1);
    }
  });

  it.each([
    {
      name: "title",
      input: { title: " ", dueDate: "2026-11-20", priority: "Low" },
      message: "Title is required.",
    },
    {
      name: "dueDate",
      input: { title: "Triage backlog", dueDate: "", priority: "Medium" },
      message: "Due date is required.",
    },
    {
      name: "priority",
      input: { title: "Triage backlog", dueDate: "2026-11-20", priority: "" },
      message: "Priority is required.",
    },
  ] satisfies Array<{ name: keyof TaskCreateInput; input: TaskCreateInput; message: string }>)(
    "returns validation failure and creates no task when $name is missing",
    ({ name, input, message }) => {
      const result = createTask(input);

      expect(result.ok).toBe(false);

      if (!result.ok) {
        expect(result.error.code).toBe("validation_failed");
        expect(result.error.fieldErrors).toEqual([{ field: name, message }]);
      }

      const tasks = listTasks();
      expect(tasks.ok).toBe(true);

      if (tasks.ok) {
        expect(tasks.data).toHaveLength(0);
      }
    },
  );
});
