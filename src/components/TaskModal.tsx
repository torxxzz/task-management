import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { Save, X } from 'lucide-react';
import { useCategories } from '../hooks/UseCategories.tsx';
import type { Task, TaskCreateData, TaskUpdateData } from '../api/TaskApi.tsx';

type TaskFormState = {
  title: string;
  desc: string;
  priority: Task['priority'];
  category: string;
  due: string;
};

const EMPTY: TaskFormState = { title: '', desc: '', priority: 'medium', category: 'General', due: '' };

type TaskModalProps = {
  task?: Task | null;
  onSave: (data: TaskCreateData | TaskUpdateData) => Promise<void> | void;
  onClose: () => void;
};

export default function TaskModal({ task, onSave, onClose }: TaskModalProps) {
  const { categories } = useCategories();
  const [form, setForm] = useState<TaskFormState>(EMPTY);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (task) {
      setForm({ title: task.title, desc: task.desc || '', priority: task.priority, category: task.category, due: task.due || '' });
    } else {
      setForm(EMPTY);
    }
    setError('');
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [task]);

  useEffect(() => {
    const handler = (e: KeyboardEvent<Window>) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler as unknown as EventListener);
    return () => window.removeEventListener('keydown', handler as unknown as EventListener);
  }, [onClose]);

  const setField = (field: keyof TaskFormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value } as TaskFormState));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required.');
      titleRef.current?.focus();
      return;
    }

    await onSave({ ...form, title: form.title.trim() });
    onClose();
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSave();
  };

  const handleBackgroundClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains('modal-bg')) {
      onClose();
    }
  };

  return (
    <div className="modal-bg" onClick={handleBackgroundClick}>
      <div className="modal" onKeyDown={handleKey} role="dialog" aria-modal="true" aria-label={task ? 'Edit task' : 'Add task'}>
        <div className="modal-header">
          <h2>{task ? 'Edit task' : 'Add task'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="form-group">
          <label htmlFor="f-title">Title <span className="required">*</span></label>
          <input
            id="f-title"
            ref={titleRef}
            value={form.title}
            onChange={setField('title')}
            placeholder="What needs to be done?"
            maxLength={120}
            className={error ? 'input-error' : ''}
          />
          {error && <p className="error-msg">{error}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="f-desc">Description</label>
          <textarea
            id="f-desc"
            value={form.desc}
            onChange={setField('desc')}
            placeholder="Optional details…"
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="f-priority">Priority</label>
            <select id="f-priority" value={form.priority} onChange={setField('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="f-category">Label / Category</label>
            <select id="f-category" value={form.category} onChange={setField('category')}>
              {categories.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="f-due">Due date</label>
          <input id="f-due" type="date" value={form.due} onChange={setField('due')} />
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>
            <Save size={15} /> Save task
          </button>
        </div>

        <p className="modal-hint">Ctrl + Enter to save</p>
      </div>
    </div>
  );
}
