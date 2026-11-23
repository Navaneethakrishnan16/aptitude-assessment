import { useEffect, useState } from "react";
import { API_BASE_URL, api, getAdminToken } from "../api/client";

interface ResultItem {
  attempt_id: number;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  score: number;
  percentage: number;
  status: string;
  submitted_at: string;
}

interface ResultsResp {
  items: ResultItem[];
  total: number;
  page: number;
  page_size: number;
}

interface DetailResp {
  candidate: { full_name: string; email: string; phone: string; age: number };
  summary: Record<string, unknown>;
  questions: {
    question_text: string;
    options: Record<string, string>;
    candidate_answer: string | null;
    correct_answer: string;
    is_correct: boolean | null;
  }[];
}

export default function AdminResults() {
  const [data, setData] = useState<ResultsResp | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<DetailResp | null>(null);

  function load() {
    const params = new URLSearchParams({ sort_by: sortBy, sort_dir: "desc", page: String(page), page_size: "10" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    api.get<ResultsResp>(`/api/admin/results?${params.toString()}`).then(setData);
  }

  useEffect(load, [search, status, sortBy, page]);

  function exportCsv() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const url = `${API_BASE_URL}/api/admin/results/export/csv?${params.toString()}`;
    fetch(url, { headers: { Authorization: `Bearer ${getAdminToken()}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "candidate_results.csv";
        a.click();
      });
  }

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Candidate Results</h1>
        <button onClick={exportCsv} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm">
          Export CSV
        </button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          placeholder="Search name or email"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="rounded-md border border-slate-300 px-3 py-2 flex-1 min-w-[200px]"
        />
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="rounded-md border border-slate-300 px-3 py-2">
          <option value="">All statuses</option>
          <option value="Pass">Pass</option>
          <option value="Fail">Fail</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "date" | "score")} className="rounded-md border border-slate-300 px-3 py-2">
          <option value="date">Sort by date</option>
          <option value="score">Sort by score</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Phone</th>
              <th className="p-3">Age</th><th className="p-3">Score</th><th className="p-3">%</th>
              <th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((r) => (
              <tr key={r.attempt_id} className="border-t">
                <td className="p-3">{r.full_name}</td>
                <td className="p-3">{r.email}</td>
                <td className="p-3">{r.phone}</td>
                <td className="p-3">{r.age}</td>
                <td className="p-3">{r.score}</td>
                <td className="p-3">{r.percentage}%</td>
                <td className="p-3">
                  <span className={r.status === "Pass" ? "text-green-600" : "text-red-600"}>{r.status}</span>
                </td>
                <td className="p-3">{new Date(r.submitted_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <button
                    className="text-indigo-600"
                    onClick={() => api.get<DetailResp>(`/api/admin/results/${r.attempt_id}`).then(setDetail)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-8 h-8 rounded-md text-sm ${p === page ? "bg-indigo-600 text-white" : "bg-white border border-slate-300"}`}
          >
            {p}
          </button>
        ))}
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <h3 className="font-semibold text-lg mb-1">{detail.candidate.full_name}</h3>
            <p className="text-sm text-slate-500 mb-4">{detail.candidate.email}</p>
            {detail.questions.map((q, i) => (
              <div key={i} className="mb-4 pb-4 border-b last:border-0">
                <p className="font-medium text-slate-800 mb-1">{i + 1}. {q.question_text}</p>
                <p className="text-sm">
                  Candidate's answer:{" "}
                  <span className={q.is_correct ? "text-green-600" : "text-red-600"}>
                    {q.candidate_answer ?? "Not attempted"}
                  </span>
                  {" · "}Correct answer: <span className="text-green-700">{q.correct_answer}</span>
                </p>
              </div>
            ))}
            <button onClick={() => setDetail(null)} className="px-4 py-2 rounded-md border border-slate-300">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
