import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Task } from "../../../domain/tasks/taskTypes";
import { createTask, listTasks } from "../../../features/tasks/taskController";
import { TaskDashboard } from "../TaskDashboard";

describe("TaskDashboard completion", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("displays a task as completed after marking it complete", async () => {
    const user = userEvent.setup();
    const task = seedTask();
    const { container } = render(<TaskDashboard tasks={[task]} />);

    await user.click(screen.getByRole("button", { name: /mark completed/i }));

    const details = screen.getByLabelText(`${task.title} details`);
    expect(within(details).getByText("Completed")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /mark completed/i })).toBeNull();
    expect(getStatValue(container, "Pending")).toBe("0");
    expect(getStatValue(container, "Completed")).toBe("1");
  });

  it("displays completed status from localStorage-backed state after a reload simulation", async () => {
    const user = userEvent.setup();
    const task = seedTask();

    render(<TaskDashboard tasks={[task]} />);
    await user.click(screen.getByRole("button", { name: /mark completed/i }));
    cleanup();

    const persistedTasks = listTasks();
    expect(persistedTasks.ok).toBe(true);

    if (!persistedTasks.ok) {
      return;
    }

    render(<TaskDashboard tasks={persistedTasks.data} />);

    const details = screen.getByLabelText(`${task.title} details`);
    expect(within(details).getByText("Completed")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /mark completed/i })).toBeNull();
  });
});

function seedTask(): Task {
  const createdTask = createTask({
    title: "Review completion flow",
    description: "Confirm the dashboard reflects stored status.",
    dueDate: "2026-11-20",
    priority: "High",
  });

  if (!createdTask.ok) {
    throw new Error("Expected test task to be created.");
  }

  return createdTask.data;
}

function getStatValue(container: HTMLElement, label: string): string {
  const statCards = Array.from(container.querySelectorAll(".stat-card"));
  const statCard = statCards.find((card) => card.textContent?.includes(label));

  if (!statCard) {
    throw new Error(`Expected ${label} stat to be rendered.`);
  }

  return statCard.querySelector("strong")?.textContent ?? "";
}
