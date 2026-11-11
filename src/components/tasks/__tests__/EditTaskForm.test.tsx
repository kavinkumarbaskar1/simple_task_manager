import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTask, findTask } from "../../../features/tasks/taskController";
import type { Task } from "../../../domain/tasks/taskTypes";
import { EditTaskForm } from "../EditTaskForm";

describe("EditTaskForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("saves edited task fields", async () => {
    const user = userEvent.setup();
    const task = seedTask();
    const onCancel = vi.fn();
    const onTaskUpdated = vi.fn();

    render(<EditTaskForm task={task} onCancel={onCancel} onTaskUpdated={onTaskUpdated} />);

    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Send customer summary");
    await user.clear(screen.getByLabelText(/description/i));
    await user.type(screen.getByLabelText(/description/i), "Summarize decisions and next steps.");
    await user.clear(screen.getByLabelText(/due date/i));
    await user.type(screen.getByLabelText(/due date/i), "2026-11-25");
    await user.selectOptions(screen.getByLabelText(/priority/i), "High");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(onCancel).not.toHaveBeenCalled();
    expect(onTaskUpdated).toHaveBeenCalledTimes(1);
    expect(onTaskUpdated).toHaveBeenCalledWith({
      id: task.id,
      title: "Send customer summary",
      description: "Summarize decisions and next steps.",
      dueDate: "2026-11-25",
      priority: "High",
      status: "Pending",
    });

    const storedTask = findTask(task.id);
    expect(storedTask.ok).toBe(true);

    if (storedTask.ok) {
      expect(storedTask.data.title).toBe("Send customer summary");
      expect(storedTask.data.description).toBe("Summarize decisions and next steps.");
      expect(storedTask.data.dueDate).toBe("2026-11-25");
      expect(storedTask.data.priority).toBe("High");
    }
  });

  it("shows validation errors without updating stored task values", async () => {
    const user = userEvent.setup();
    const task = seedTask();
    const onTaskUpdated = vi.fn();

    render(<EditTaskForm task={task} onCancel={vi.fn()} onTaskUpdated={onTaskUpdated} />);

    await user.clear(screen.getByLabelText(/title/i));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByText("Title is required.")).toBeTruthy();
    expect(onTaskUpdated).not.toHaveBeenCalled();

    const storedTask = findTask(task.id);
    expect(storedTask.ok).toBe(true);

    if (storedTask.ok) {
      expect(storedTask.data).toEqual(task);
    }
  });

  it("cancels editing without updating stored task values", async () => {
    const user = userEvent.setup();
    const task = seedTask();
    const onCancel = vi.fn();
    const onTaskUpdated = vi.fn();

    render(<EditTaskForm task={task} onCancel={onCancel} onTaskUpdated={onTaskUpdated} />);

    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Unsaved title");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onTaskUpdated).not.toHaveBeenCalled();

    const storedTask = findTask(task.id);
    expect(storedTask.ok).toBe(true);

    if (storedTask.ok) {
      expect(storedTask.data).toEqual(task);
    }
  });
});

function seedTask(): Task {
  const createdTask = createTask({
    title: "Send project summary",
    description: "Include owners and deadlines.",
    dueDate: "2026-11-20",
    priority: "Medium",
  });

  if (!createdTask.ok) {
    throw new Error("Expected test task to be created.");
  }

  return createdTask.data;
}
