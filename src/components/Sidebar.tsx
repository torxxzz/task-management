import { useState } from 'react';
import { CheckSquare, LayoutList, Clock, CheckCircle, Trash2, Plus, Tag } from 'lucide-react';
import { useCategories, COLOR_OPTIONS } from '../hooks/UseCategories.tsx';

type FilterKey = 'all' | 'active' | 'completed';

type SidebarProps = {
  filter: FilterKey;
  onFilterChange: (key: FilterKey) => void;
  stats: { total: number; active: number; completed: number; highPriority: number; };
  onClearDone: () => void;
};

const NAV_ITEMS: Array<{ key: FilterKey; label: string; Icon: typeof LayoutList }> = [
  { key: 'all', label: 'All Tasks', Icon: LayoutList },
  { key: 'active', label: 'Active', Icon: Clock },
  { key: 'completed', label: 'Completed', Icon: CheckCircle },
];

export default function Sidebar({ filter, onFilterChange, stats, onClearDone }: SidebarProps) {
  const { categories, addCategory, removeCategory, loading } = useCategories();
  const [newCat, setNewCat] = useState('');
  const [colorIdx, setColorIdx] = useState(0);

  const badgeCount: Record<FilterKey, number> = { all: stats.total, active: stats.active, completed: stats.completed };

  const handleAdd = async () => {
    if (await addCategory(newCat, colorIdx)) {
      setNewCat('');
    }
  };

  return (
    <aside className="sidebar">
      <div className="logo">
        <CheckSquare size={18} color="#534AB7" />
        <span>Task Management</span>
      </div>

      <nav>
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`nav-btn ${filter === key ? 'active' : ''}`}
            onClick={() => onFilterChange(key)}
          >
            <Icon size={16} />
            <span>{label}</span>
            <span className="badge">{badgeCount[key]}</span>
          </button>
        ))}
      </nav>

      <div className="label-section">
        <div className="section-title"><Tag size={12} /> Labels</div>

        {loading ? (
          <p style={{ fontSize: '12px', opacity: 0.5 }}>Loading...</p>
        ) : (
          <div className="cat-pills">
            {categories.map(cat => (
              <span key={cat.name} className="cat-pill" style={{ background: cat.bg, color: cat.text }}>
                {cat.name}
                <button onClick={() => removeCategory(cat.name)} title="Remove label">×</button>
              </span>
            ))}
          </div>
        )}

        <div className="color-row">
          {COLOR_OPTIONS.map((c, i) => (
            <button
              key={i}
              className={`color-dot ${i === colorIdx ? 'selected' : ''}`}
              style={{ background: c.color, borderColor: i === colorIdx ? '#1a1a18' : 'transparent' }}
              onClick={() => setColorIdx(i)}
              title="Pick color"
            />
          ))}
        </div>

        <div className="new-cat-row">
          <input
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="New label..."
            maxLength={20}
            className="cat-input"
          />
          <button className="btn-add-cat" onClick={handleAdd}><Plus size={14} /></button>
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="nav-btn danger" onClick={onClearDone}>
          <Trash2 size={16} />
          <span>Clear done</span>
        </button>
      </div>
    </aside>
  );
}