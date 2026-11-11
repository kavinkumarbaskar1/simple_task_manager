import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Task } from "../../../domain/tasks/taskTypes";
import { createTask, listTasks } from "../../../features/tasks/taskController";
import { TaskDashboard } from "../TaskDashboard";

describe("TaskDashboard deletion", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("removes only the selected task from the dashboard", async () => {
    const user = userEvent.setup();
    const deletedTask = seedTask("Delete dashboard task", "2026-11-18", "High");
    const preservedTask = seedTask("Keep dashboard task", "2026-11-20", "Medium");

    render(<TaskDashboard tasks={[deletedTask, preservedTask]} />);

    await user.click(deleteButtonForTask(deletedTask));

    expect(screen.queryByText(deletedTask.title)).toBeNull();
    expect(screen.getByText(preservedTask.title)).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    const storedTasks = listTasks();
    expect(storedTasks.ok).toBe(true);

    if (storedTasks.ok) {
      expect(storedTasks.data).toEqual([preservedTask]);
    }
  });

  it("keeps a deleted task absent after a reload simulation", async () => {
    const user = userEvent.setup();
    const deletedTask = seedTask("Reload removed task", "2026-11-21", "Low");
    const preservedTask = seedTask("Reload preserved task", "2026-11-22", "High");

    render(<TaskDashboard tasks={[deletedTask, preservedTask]} />);
    await user.click(deleteButtonForTask(deletedTask));
    cleanup();

    const persistedTasks = listTasks();
    expect(persistedTasks.ok).toBe(true);

    if (!persistedTasks.ok) {
      return;
    }

    render(<TaskDashboard tasks={persistedTasks.data} />);

    expect(screen.queryByText(deletedTask.title)).toBeNull();
    expect(screen.getByText(preservedTask.title)).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});

function seedTask(title: string, dueDate: string, priority: "High" | "Medium" | "Low"): Task {
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

function deleteButtonForTask(task: Task): HTMLButtonElement {
  const taskDetails = screen.getByLabelText(`${task.title} details`);
  const taskCard = taskDetails.closest("li");

  if (!taskCard) {
    throw new Error(`Expected ${task.title} card to be rendered.`);
  }

  const deleteButton = Array.from(taskCard.querySelectorAll("button")).find(
    (button) => button.textContent === "Delete",
  );

  if (!(deleteButton instanceof HTMLButtonElement)) {
    throw new Error(`Expected ${task.title} delete button to be rendered.`);
  }

  return deleteButton;
}
