// @todo/shared public API entrypoint
export const SHARED_MODULE_VERSION = '0.1.0';

export interface UserSummary {
  id: string;
  username: string;
  taskCount?: number;
}

export interface TodoSummary {
  id: string;
  title: string;
  assigneeId: string;
  completed: boolean;
  createdAt: string;
  isOptimistic?: boolean;
}
