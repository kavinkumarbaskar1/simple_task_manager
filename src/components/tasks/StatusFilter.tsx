import type { TaskStatus } from "../../domain/tasks/taskTypes";

export type TaskStatusFilter = "All" | TaskStatus;

interface StatusFilterProps {
  selectedFilter: TaskStatusFilter;
  onFilterChange: (filter: TaskStatusFilter) => void;
}

const statusFilters: readonly TaskStatusFilter[] = ["All", "Pending", "Completed"];

export function StatusFilter({ selectedFilter, onFilterChange }: StatusFilterProps) {
  return (
    <div className="segmented-control" aria-label="Task status filter">
      {statusFilters.map((filter) => (
        <button
          type="button"
          key={filter}
          aria-pressed={selectedFilter === filter}
          onClick={() => onFilterChange(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
