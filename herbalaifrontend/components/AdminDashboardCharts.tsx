'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type ChartEntry = { name: string; value: number };

interface ChartData {
  herbsByCategory: ChartEntry[];
  suggestionsByStatus: ChartEntry[];
  threadsByCategory: ChartEntry[];
}

const herbColors = ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'];
const threadColors = ['#1b4332', '#2d6a4f', '#40916c'];

export default function AdminDashboardCharts({ data }: { data: ChartData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="font-black italic text-lg text-[#1b4332] mb-4">Herbs by Category</h2>
        {data.herbsByCategory.length === 0 ? <p className="text-xs text-gray-500 text-center py-10">No data available</p> : (
          <div className="h-64 flex flex-col justify-between">
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={data.herbsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={48}>
                    {data.herbsByCategory.map((entry, index) => <Cell key={entry.name} fill={herbColors[index % herbColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div tabIndex={0} role="region" aria-label="Herb category counts" className="h-[96px] overflow-y-auto mt-1 pr-1 space-y-1 scrollbar-thin">
              {data.herbsByCategory.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-[11px] border-b border-gray-50 pb-0.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: herbColors[index % herbColors.length] }} />
                    <span className="truncate font-bold text-[#1b4332]/80" title={entry.name}>{entry.name}</span>
                  </div>
                  <span className="font-extrabold text-[#1b4332] pl-2">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="font-black italic text-lg text-[#1b4332] mb-4">Suggestions Status</h2>
        {data.suggestionsByStatus.length === 0 ? <p className="text-xs text-gray-500 text-center py-10">No data available</p> : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data.suggestionsByStatus}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f0f7f2' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.suggestionsByStatus.map((entry) => <Cell key={entry.name} fill={entry.name === 'Approved' ? '#2d6a4f' : entry.name === 'Pending' ? '#d4a373' : '#e5989b'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="font-black italic text-lg text-[#1b4332] mb-4">Forum Discussions</h2>
        {data.threadsByCategory.length === 0 ? <p className="text-xs text-gray-500 text-center py-10">No data available</p> : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie data={data.threadsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {data.threadsByCategory.map((entry, index) => <Cell key={entry.name} fill={threadColors[index % threadColors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
