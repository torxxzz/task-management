import { List, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { TaskStats } from '../api/TaskApi.tsx';

type StatCard = {
  key: keyof TaskStats;
  label: string;
  sub: string;
  Icon: typeof List;
};

const CARDS: StatCard[] = [
  { key: 'total',        label: 'Total tasks',   sub: 'All time',        Icon: List         },
  { key: 'active',       label: 'Active',        sub: 'In progress',     Icon: Clock        },
  { key: 'completed',    label: 'Completed',     sub: 'Finished',        Icon: CheckCircle  },
  { key: 'highPriority', label: 'High priority', sub: 'Needs attention', Icon: AlertCircle  },
];

export default function StatsGrid({ stats }: { stats: TaskStats }) {
  return (
    <div className="stats-grid">
      {CARDS.map(({ key, label, sub, Icon }) => (
        <div key={key} className="stat-card">
          <div className="stat-label">
            <Icon size={14} />
            {label}
          </div>
          <div className="stat-value">{stats[key] ?? 0}</div>
          <div className="stat-sub">{sub}</div>
        </div>
      ))}
    </div>
  );
}
