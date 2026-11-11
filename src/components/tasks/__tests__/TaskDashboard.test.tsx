import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Task } from "../../../domain/tasks/taskTypes";
import { TaskDashboard } from "../TaskDashboard";

describe("TaskDashboard", () => {
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
