import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { listTasks } from "../../../features/tasks/taskController";
import { TaskForm } from "../TaskForm";

describe("TaskForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("creates a task with required fields and an optional description", async () => {
    const user = userEvent.setup();
    const onTaskCreated = vi.fn();

    render(<TaskForm onTaskCreated={onTaskCreated} />);

    await user.type(screen.getByLabelText(/title/i), "Draft status update");
    await user.type(screen.getByLabelText(/description/i), "Include project risks.");
    await user.type(screen.getByLabelText(/due date/i), "2026-11-16");
    await user.selectOptions(screen.getByLabelText(/priority/i), "High");
    await user.click(screen.getByRole("button", { name: /create task/i }));

    expect(onTaskCreated).toHaveBeenCalledTimes(1);
    expect(onTaskCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Draft status update",
        description: "Include project risks.",
        dueDate: "2026-11-16",
        priority: "High",
        status: "Pending",
      }),
    );

    const tasks = listTasks();
    expect(tasks.ok).toBe(true);

    if (tasks.ok) {
      expect(tasks.data).toHaveLength(1);
    }
  });

  it("creates a task when description is empty", async () => {
    const user = userEvent.setup();
    const onTaskCreated = vi.fn();

    render(<TaskForm onTaskCreated={onTaskCreated} />);

    await user.type(screen.getByLabelText(/title/i), "Book stakeholder review");
    await user.type(screen.getByLabelText(/due date/i), "2026-11-17");
    await user.selectOptions(screen.getByLabelText(/priority/i), "Medium");
    await user.click(screen.getByRole("button", { name: /create task/i }));

    expect(onTaskCreated).toHaveBeenCalledTimes(1);
    expect(onTaskCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Book stakeholder review",
        description: undefined,
        dueDate: "2026-11-17",
        priority: "Medium",
        status: "Pending",
      }),
    );
  });

  it("shows required-field validation failures without creating a task", async () => {
    const user = userEvent.setup();
    const onTaskCreated = vi.fn();

    render(<TaskForm onTaskCreated={onTaskCreated} />);

    await user.click(screen.getByRole("button", { name: /create task/i }));

    expect(screen.getByText("Title is required.")).toBeTruthy();
    expect(screen.getByText("Due date is required.")).toBeTruthy();
    expect(screen.getByText("Priority is required.")).toBeTruthy();
    expect(onTaskCreated).not.toHaveBeenCalled();

    const tasks = listTasks();
    expect(tasks.ok).toBe(true);

    if (tasks.ok) {
      expect(tasks.data).toHaveLength(0);
    }
  });
});
