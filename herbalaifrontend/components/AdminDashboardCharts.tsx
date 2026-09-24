'use client';

import { Cell, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

type ChartEntry = { name: string; value: number };

interface ChartData {
  herbsByCategory: ChartEntry[];
  suggestionsByStatus: ChartEntry[];
  threadsByCategory: ChartEntry[];
}

const categoryColors = ['#286344', '#4a8a62', '#75ae83', '#a7cba8', '#bd9973', '#819c73'];
const suggestionStatuses = [
  { name: 'Pending', label: 'Pending', color: 'var(--ui-ochre)' },
  { name: 'Approved', label: 'Approved', color: 'var(--ui-brand)' },
  { name: 'Rejected', label: 'Rejected', color: 'var(--ui-error-ink)' },
  { name: 'ChangesRequested', label: 'Revision Needed', color: 'var(--ui-warning-ink)' },
] as const;

function DonutCard({ title, entries }: { title: string; entries: ChartEntry[] }) {
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <Card className="min-w-0">
      <CardHeader><CardTitle className="text-base text-ink">{title}</CardTitle></CardHeader>
      <CardContent className="pt-4">
        {total === 0 ? (
          <p className="flex min-h-64 items-center justify-center text-sm text-muted">No data available</p>
        ) : (
          <div className="flex min-h-64 flex-col items-center gap-4">
            <div className="relative h-40 w-40 shrink-0" aria-hidden="true">
                <PieChart width={160} height={160}>
                  <Pie data={entries} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={76} stroke="var(--ui-panel)" strokeWidth={2} isAnimationActive={false}>
                    {entries.map((entry, index) => <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />)}
                  </Pie>
                </PieChart>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums text-ink">{total}</span>
                <span className="text-xs text-muted">total</span>
              </div>
            </div>
            <div className="max-h-32 w-full overflow-y-auto pr-1" role="list" aria-label={`${title} counts`}>
              {entries.map((entry, index) => (
                <div key={entry.name} role="listitem" className="flex min-h-8 items-center justify-between gap-3 border-b border-border py-1 text-sm last:border-0">
                  <span className="flex min-w-0 items-center gap-2 text-muted">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColors[index % categoryColors.length] }} aria-hidden="true" />
                    <span className="truncate" title={entry.name}>{entry.name}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-ink">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusCard({ entries }: { entries: ChartEntry[] }) {
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  const counts = new Map(entries.map((entry) => [entry.name, entry.value]));

  return (
    <Card className="min-w-0 lg:flex lg:flex-col">
      <CardHeader><CardTitle className="text-base text-ink">Suggestions Status</CardTitle></CardHeader>
      <CardContent className="pt-4 lg:flex lg:flex-1 lg:items-center">
          <div className="grid w-full gap-4">
            {suggestionStatuses.map(({ name, label, color }) => {
              const value = counts.get(name) ?? 0;
              return (
                <div key={name}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-ink">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                      {label}
                    </span>
                    <span className="tabular-nums text-muted">{value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={Math.max(total, 1)} aria-valuenow={value}>
                    <div className="h-full rounded-full" style={{ width: `${total ? value / total * 100 : 0}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardCharts({ data }: { data: ChartData }) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <DonutCard title="Herbs by Category" entries={data.herbsByCategory} />
      <StatusCard entries={data.suggestionsByStatus} />
      <DonutCard title="Forum Discussions" entries={data.threadsByCategory} />
    </div>
  );
}
