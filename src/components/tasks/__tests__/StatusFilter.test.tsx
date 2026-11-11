import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Task } from "../../../domain/tasks/taskTypes";
import { completeTask, createTask, listTasks } from "../../../features/tasks/taskController";
import { StatusFilter, type TaskStatusFilter } from "../StatusFilter";
import { TaskDashboard } from "../TaskDashboard";

describe("StatusFilter", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("exposes only All, Pending, and Completed filter choices", () => {
    render(<StatusFilter selectedFilter="All" onFilterChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "All" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pending" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Completed" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /priority|low|medium|high/i })).toBeNull();
  });

  it("reports the selected status filter when a choice is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn<(filter: TaskStatusFilter) => void>();

    render(<StatusFilter selectedFilter="All" onFilterChange={onFilterChange} />);
    await user.click(screen.getByRole("button", { name: "Pending" }));
    await user.click(screen.getByRole("button", { name: "Completed" }));

    expect(onFilterChange).toHaveBeenNthCalledWith(1, "Pending");
    expect(onFilterChange).toHaveBeenNthCalledWith(2, "Completed");
  });

  it("changes displayed dashboard tasks for All, Pending, and Completed", async () => {
    const user = userEvent.setup();
    const seededTasks = seedStoredTasks();

    render(<TaskDashboard tasks={seededTasks} />);

    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Prepare onboarding list")).toBeTruthy();
    expect(screen.getByText("Archive closed launch item")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Pending" }));
    expect(screen.getByRole("button", { name: "Pending" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByText("Prepare onboarding list")).toBeTruthy();
    expect(screen.queryByText("Archive closed launch item")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Completed" }));
    expect(screen.getByRole("button", { name: "Completed" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.queryByText("Prepare onboarding list")).toBeNull();
    expect(screen.getByText("Archive closed launch item")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Prepare onboarding list")).toBeTruthy();
    expect(screen.getByText("Archive closed launch item")).toBeTruthy();
  });
});

function seedStoredTasks(): Task[] {
  const pendingTask = createTask({
    title: "Prepare onboarding list",
    dueDate: "2026-11-18",
    priority: "Medium",
  });
  const completedTask = createTask({
    title: "Archive closed launch item",
    dueDate: "2026-11-19",
    priority: "High",
  });

  if (!pendingTask.ok || !completedTask.ok) {
    throw new Error("Expected dashboard filter test tasks to be created.");
  }

  const completedResult = completeTask(completedTask.data.id);

  if (!completedResult.ok) {
    throw new Error("Expected dashboard filter test task to be completed.");
  }

  const listedTasks = listTasks();

  if (!listedTasks.ok) {
    throw new Error("Expected dashboard filter test tasks to be listed.");
  }

  return listedTasks.data;
}
