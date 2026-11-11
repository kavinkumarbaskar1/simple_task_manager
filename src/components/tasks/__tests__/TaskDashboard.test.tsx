import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Task } from "../../../domain/tasks/taskTypes";
import { completeTask, createTask, listTasks } from "../../../features/tasks/taskController";
import { TaskDashboard } from "../TaskDashboard";

describe("TaskDashboard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders every provided task with title, due date, priority, and status", () => {
    render(<TaskDashboard tasks={tasks} />);

    const taskItems = screen.getAllByRole("listitem");
    expect(taskItems).toHaveLength(3);

    expect(screen.getByRole("list", { name: /tasks/i })).toBeTruthy();

    tasks.forEach((task) => {
      const details = screen.getByLabelText(`${task.title} details`);

      expect(screen.getByText(task.title)).toBeTruthy();
      expect(within(details).getByText(task.dueDate)).toBeTruthy();
      expect(within(details).getByText(task.priority)).toBeTruthy();
      expect(within(details).getByText(task.status)).toBeTruthy();
    });
  });

  it("renders an empty state without task rows or cards", () => {
    const { container } = render(<TaskDashboard tasks={[]} />);

    expect(screen.getByText("No tasks yet")).toBeTruthy();
    expect(screen.queryByRole("list", { name: /tasks/i })).toBeNull();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(container.querySelectorAll(".task-card")).toHaveLength(0);
  });

  it("defaults to All and displays pending and completed tasks", () => {
    render(<TaskDashboard tasks={tasks} />);

    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Draft product brief")).toBeTruthy();
    expect(screen.getByText("Confirm launch checklist")).toBeTruthy();
    expect(screen.getByText("Schedule support handoff")).toBeTruthy();
  });

  it("displays only pending tasks when Pending is selected", async () => {
    const user = userEvent.setup();
    const seededTasks = seedStoredTasks();

    render(<TaskDashboard tasks={seededTasks} />);
    await user.click(screen.getByRole("button", { name: "Pending" }));

    expect(screen.getByText("Stored pending task")).toBeTruthy();
    expect(screen.queryByText("Stored completed task")).toBeNull();
  });

  it("displays only completed tasks when Completed is selected", async () => {
    const user = userEvent.setup();
    const seededTasks = seedStoredTasks();

    render(<TaskDashboard tasks={seededTasks} />);
    await user.click(screen.getByRole("button", { name: "Completed" }));

    expect(screen.getByText("Stored completed task")).toBeTruthy();
    expect(screen.queryByText("Stored pending task")).toBeNull();
  });

  it("returns to pending and completed tasks when All is selected", async () => {
    const user = userEvent.setup();
    const seededTasks = seedStoredTasks();

    render(<TaskDashboard tasks={seededTasks} />);
    await user.click(screen.getByRole("button", { name: "Pending" }));
    await user.click(screen.getByRole("button", { name: "All" }));

    expect(screen.getByText("Stored pending task")).toBeTruthy();
    expect(screen.getByText("Stored completed task")).toBeTruthy();
  });

  it("does not render priority filter controls", () => {
    render(<TaskDashboard tasks={tasks} />);

    expect(screen.queryByRole("group", { name: /priority/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /priority|low|medium|high/i })).toBeNull();
  });
});

const tasks: Task[] = [
  {
    id: "task-1",
    title: "Draft product brief",
    dueDate: "2026-11-14",
    priority: "High",
    status: "Pending",
  },
  {
    id: "task-2",
    title: "Confirm launch checklist",
    dueDate: "2026-11-16",
    priority: "Medium",
    status: "Completed",
  },
  {
    id: "task-3",
    title: "Schedule support handoff",
    dueDate: "2026-11-18",
    priority: "Low",
    status: "Pending",
  },
];

function seedStoredTasks(): Task[] {
  const pendingTask = createTask({
    title: "Stored pending task",
    dueDate: "2026-11-18",
    priority: "Medium",
  });
  const completedTask = createTask({
    title: "Stored completed task",
    dueDate: "2026-11-19",
    priority: "High",
  });

  if (!pendingTask.ok || !completedTask.ok) {
    throw new Error("Expected test tasks to be created.");
  }

  const completedResult = completeTask(completedTask.data.id);

  if (!completedResult.ok) {
    throw new Error("Expected test task to be completed.");
  }

  const listedTasks = listTasks();

  if (!listedTasks.ok) {
    throw new Error("Expected test tasks to be listed.");
  }

  return listedTasks.data;
}
