import { Calendar, Pencil, Trash2 } from 'lucide-react';
import { useCategories } from '../hooks/UseCategories.tsx';
import type { Task } from '../api/TaskApi.tsx';

const PRIORITY_COLORS: Record<Task['priority'], { bar: string; bg: string; text: string }> = {
  high: { bar: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D' },
  medium: { bar: '#EF9F27', bg: '#FAEEDA', text: '#854F0B' },
  low: { bar: '#1D9E75', bg: '#E1F5EE', text: '#0F6E56' },
};

function formatDate(d: string | number | undefined) {
  if (d === undefined || d === null) return null;
  const date = typeof d === 'number' ? new Date(d) : new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(d: string | undefined, completed: boolean) {
  if (!d || completed) return false;
  return new Date(d + 'T23:59:59') < new Date();
}

type TaskCardProps = {
  task: Task;
  onToggle: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
};

export default function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const { getCategory } = useCategories();
  const cat = getCategory(task.category);
  const pri = PRIORITY_COLORS[task.priority];
  const overdue = isOverdue(task.due, task.completed);

  return (
    <div className={`task-card ${task.completed ? 'done' : ''}`}>
      <div className="priority-bar" style={{ background: pri.bar }} />

      <button
        className={`check-btn ${task.completed ? 'checked' : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && <span className="check-icon">✓</span>}
      </button>

      <div className="task-body">
        <div className={`task-title ${task.completed ? 'strikethrough' : ''}`}>
          {task.title}
        </div>
        {task.desc && <div className="task-desc">{task.desc}</div>}
        <div className="task-meta">
          <span className="tag" style={{ background: cat.bg, color: cat.text }}>
            {task.category}
          </span>
          <span className="tag" style={{ background: pri.bg, color: pri.text }}>
            {task.priority}
          </span>
          {task.due && (
            <span className="task-date" style={{ color: overdue ? '#A32D2D' : undefined }}>
              <Calendar size={12} />
              {formatDate(task.due)}{overdue ? ' · overdue' : ''}
            </span>
          )}
          <span className="task-date created-date">
            Created {formatDate(task.createdAt)}
          </span>
        </div>
      </div>

      <div className="task-actions">
        <button className="icon-btn" onClick={() => onEdit(task)} aria-label="Edit task">
          <Pencil size={15} />
        </button>
        <button className="icon-btn del" onClick={() => onDelete(task.id)} aria-label="Delete task">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
