import { ClipboardList } from 'lucide-react';
import TaskCard from './TaskCard.tsx';
import type { Task } from '../api/TaskApi.tsx';

type TaskListProps = {
  tasks: Task[];
  loading: boolean;
  onToggle: (id: number) => void;
  onOpen: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
};

export default function TaskList({ tasks, loading, onToggle, onOpen, onEdit, onDelete }: TaskListProps) {
  return (
    <div>
      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <span>Loading tasks…</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty">
          <ClipboardList size={40} strokeWidth={1.2} />
          <p>No tasks here yet.</p>
          <p className="empty-sub">Add one with the button above.</p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
