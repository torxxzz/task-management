import { useState, useEffect } from 'react';
import { Plus, Search, Moon, Sun } from 'lucide-react';
import Sidebar from './components/Sidebar.tsx';
import StatsGrid from './components/StatsGrid.tsx';
import TaskList from './components/TaskList.tsx';
import TaskModal from './components/TaskModal.tsx';
import Toast from './components/Toast';
import { useTasks } from './hooks/UseTask.tsx';
import { useToast } from './hooks/UseToast.tsx';
import { CategoryProvider } from './hooks/UseCategories.tsx';
import type { Task, TaskCreateData, TaskUpdateData } from './api/TaskApi.tsx';

const FILTER_TITLES = { all: 'All Tasks', active: 'Active Tasks', completed: 'Completed Tasks' };

function AppInner() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sort, setSort] = useState<'created' | 'priority' | 'title' | 'due'>('created');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('light', theme === 'light');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const { toast, showToast } = useToast();
  const { tasks, stats, loading, error, addTask, editTask, toggleDone, removeTask, clearDone } = useTasks({
    filter, search, sort, category: activeCategory,
  });

  useEffect(() => {
    if (error) showToast(error);
  }, [error, showToast]);

  const openAdd = () => { setEditingTask(null); setModalOpen(true); };
  const openEdit = (task: Task) => { setEditingTask(task); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingTask(null); };

  const handleSave: (data: TaskCreateData | TaskUpdateData) => Promise<void> = async (data) => {
    if (editingTask) {
      const err = await editTask(editingTask.id, data as TaskUpdateData);
      showToast(err ?? 'Task updated');
    } else {
      const err = await addTask(data as TaskCreateData);
      showToast(err ?? 'Created task');
    }
  };

  const handleToggle: (id: number) => Promise<void> = async (id) => {
    const t = tasks.find(x => x.id === id);
    const err = await toggleDone(id);
    if (err) showToast(err);
    else showToast(t?.completed ? 'Marked as active' : 'Task completed ✓');
  };

  const handleDelete: (id: number) => Promise<void> = async (id) => {
    const confirmed = window.confirm('Do you want to delete this task?');
    if (!confirmed) {
      return;
    }

    const err = await removeTask(id);
    showToast(err ?? 'Deleted task');
  };

  const handleClearDone: () => Promise<void> = async () => {
    const err = await clearDone();
    showToast(err ?? 'Completed tasks cleared');
  };

  return (
    <div className="app">
      <Sidebar
        filter={filter}
        onFilterChange={(f) => { setFilter(f); setActiveCategory(''); }}
        stats={stats}
        onClearDone={handleClearDone}
      />

      <div className="main">
        <header className="topbar">
          <h1 className="page-title">{FILTER_TITLES[filter]}</h1>
          <div className="search-wrap">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value as 'created' | 'priority' | 'title' | 'due')}>
            <option value="created">Newest</option>
            <option value="priority">Priority</option>
            <option value="title">Title A–Z</option>
            <option value="due">Due date</option>
          </select>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add task
          </button>
        </header>

        <div className="content">
          <StatsGrid stats={stats} />
          <TaskList
            tasks={tasks}
            loading={loading}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {modalOpen && (
        <TaskModal
          task={editingTask}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

    <Toast message={toast} />
    </div>
  );
}

export default function App() {
  return (
    <CategoryProvider>
      <AppInner />
    </CategoryProvider>
  );
}