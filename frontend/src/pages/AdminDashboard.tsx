import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "../api/client";

interface Summary {
  total_candidates: number;
  tests_completed: number;
  average_percentage: number;
  pass_rate: number;
  highest_score: number;
}

interface Chart {
  pass_count: number;
  fail_count: number;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chart, setChart] = useState<Chart | null>(null);

  useEffect(() => {
    api.get<Summary>("/api/admin/dashboard/summary").then(setSummary);
    api.get<Chart>("/api/admin/dashboard/chart").then(setChart);
  }, []);

  const cards = summary
    ? [
        { label: "Total Candidates", value: summary.total_candidates },
        { label: "Tests Completed", value: summary.tests_completed },
        { label: "Average Score", value: `${summary.average_percentage}%` },
        { label: "Pass Rate", value: `${summary.pass_rate}%` },
        { label: "Highest Score", value: summary.highest_score },
      ]
    : [];

  const pieData = chart ? [
    { name: "Pass", value: chart.pass_count },
    { name: "Fail", value: chart.fail_count },
  ] : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow p-4">
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className="text-2xl font-bold text-slate-900">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6 max-w-md">
        <h2 className="font-semibold text-slate-800 mb-4">Pass / Fail Split</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
              <Cell fill="#10b981" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
