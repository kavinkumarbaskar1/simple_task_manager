import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { App } from "../../../App";
import type { Task } from "../../../domain/tasks/taskTypes";
import { createTask, listTasks } from "../../../features/tasks/taskController";
import { taskStorageKey } from "../../../storage/localTaskStorage";
import { TaskDashboard } from "../TaskDashboard";

describe("Task persistence in components", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("initializes the dashboard from persisted tasks", async () => {
    const persistedTask = seedTask("Initialize dashboard task", "2026-11-20", "High");

    render(<App />);

    expect(await screen.findByText(persistedTask.title)).toBeTruthy();
    const taskDetails = screen.getByLabelText(`${persistedTask.title} details`);
    expect(within(taskDetails).getByText(persistedTask.dueDate)).toBeTruthy();
    expect(within(taskDetails).getByText(persistedTask.priority)).toBeTruthy();
  });

  it("shows a storage error when dashboard initialization cannot read persisted tasks", async () => {
    window.localStorage.setItem(taskStorageKey, "{not valid JSON");

    render(<App />);

    expect(await screen.findByText("Saved tasks could not be read.")).toBeTruthy();
  });

  it("keeps a task created through the app form after a reload simulation", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText(/title/i), "Create persisted component task");
    await user.type(
      screen.getByLabelText(/description/i),
      "Created through the app form.",
    );
    await user.type(screen.getByLabelText(/due date/i), "2026-11-20");
    await user.selectOptions(screen.getByLabelText(/priority/i), "High");
    await user.click(screen.getByRole("button", { name: /create task/i }));

    expect(await screen.findByText("Create persisted component task")).toBeTruthy();

    cleanup();
    render(<App />);

    expect(await screen.findByText("Create persisted component task")).toBeTruthy();
  });

  it("keeps dashboard edits after a reload simulation", async () => {
    const user = userEvent.setup();
    const task = seedTask("Edit persisted component task", "2026-11-20", "Medium");

    render(<TaskDashboard tasks={[task]} />);

    await user.click(buttonForTask(task, "Edit"));
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Edited persisted component task");
    await user.clear(screen.getByLabelText(/due date/i));
    await user.type(screen.getByLabelText(/due date/i), "2026-11-23");
    await user.selectOptions(screen.getByLabelText(/priority/i), "High");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    cleanup();
    render(<TaskDashboard tasks={loadStoredTasks()} />);

    expect(screen.getByText("Edited persisted component task")).toBeTruthy();
    expect(screen.getByText("2026-11-23")).toBeTruthy();
    expect(screen.getByText("High")).toBeTruthy();
  });

  it("keeps dashboard completion and deletion after a reload simulation", async () => {
    const user = userEvent.setup();
    const completedTask = seedTask("Complete persisted component task", "2026-11-20", "High");
    const deletedTask = seedTask("Delete persisted component task", "2026-11-21", "Low");

    render(<TaskDashboard tasks={[completedTask, deletedTask]} />);

    await user.click(buttonForTask(completedTask, "Mark completed"));
    await user.click(buttonForTask(deletedTask, "Delete"));

    cleanup();
    render(<TaskDashboard tasks={loadStoredTasks()} />);

    const completedDetails = screen.getByLabelText(`${completedTask.title} details`);
    expect(within(completedDetails).getByText("Completed")).toBeTruthy();
    expect(screen.queryByText(deletedTask.title)).toBeNull();
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

function loadStoredTasks(): Task[] {
  const storedTasks = listTasks();

  if (!storedTasks.ok) {
    throw new Error("Expected stored tasks to load.");
  }

  return storedTasks.data;
}

function buttonForTask(task: Task, label: string): HTMLButtonElement {
  const taskDetails = screen.getByLabelText(`${task.title} details`);
  const taskCard = taskDetails.closest("li");

  if (!taskCard) {
    throw new Error(`Expected ${task.title} card to be rendered.`);
  }

  const button = within(taskCard).getByRole("button", { name: label });

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Expected ${label} button for ${task.title} to be rendered.`);
  }

  return button;
}
