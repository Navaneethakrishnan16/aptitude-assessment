import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Question {
  id: number;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  category: string;
  difficulty: string;
  is_active: boolean;
}

const EMPTY: Omit<Question, "id"> = {
  text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
  category: "Quantitative",
  difficulty: "Medium",
  is_active: true,
};

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editing, setEditing] = useState<Question | Omit<Question, "id"> | null>(null);
  const [error, setError] = useState("");

  function load() {
    api.get<Question[]>("/api/admin/questions").then(setQuestions);
  }

  useEffect(load, []);

  const activeCount = questions.filter((q) => q.is_active).length;

  async function save() {
    if (!editing) return;
    setError("");
    try {
      if ("id" in editing) {
        await api.put(`/api/admin/questions/${editing.id}`, editing);
      } else {
        await api.post("/api/admin/questions", editing);
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this question?")) return;
    await api.delete(`/api/admin/questions/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Questions <span className="text-sm font-normal text-slate-500">({activeCount}/10 active)</span>
        </h1>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          disabled={activeCount >= 10}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-40"
        >
          + Add Question
        </button>
      </div>

      <div className="bg-white rounded-xl shadow divide-y">
        {questions.map((q) => (
          <div key={q.id} className="p-4 flex justify-between items-start gap-4">
            <div>
              <p className="text-slate-900">{q.text}</p>
              <p className="text-xs text-slate-500 mt-1">
                {q.category} · {q.difficulty} · Correct: {q.correct_option} ·{" "}
                {q.is_active ? <span className="text-green-600">Active</span> : <span className="text-slate-400">Inactive</span>}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditing(q)} className="text-indigo-600 text-sm">Edit</button>
              <button onClick={() => remove(q.id)} className="text-red-600 text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow p-6 max-w-lg w-full">
            <h3 className="font-semibold text-lg mb-4">{"id" in editing ? "Edit" : "Add"} Question</h3>
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            <textarea
              placeholder="Question text"
              value={editing.text}
              onChange={(e) => setEditing({ ...editing, text: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 mb-3"
              rows={2}
            />
            {(["option_a", "option_b", "option_c", "option_d"] as const).map((key, i) => (
              <input
                key={key}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                value={editing[key]}
                onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 mb-3"
              />
            ))}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <select
                value={editing.correct_option}
                onChange={(e) => setEditing({ ...editing, correct_option: e.target.value })}
                className="rounded-md border border-slate-300 px-2 py-2"
              >
                {["A", "B", "C", "D"].map((o) => <option key={o}>{o}</option>)}
              </select>
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="rounded-md border border-slate-300 px-2 py-2"
              >
                {["Quantitative", "Logical Reasoning", "Verbal"].map((c) => <option key={c}>{c}</option>)}
              </select>
              <select
                value={editing.difficulty}
                onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}
                className="rounded-md border border-slate-300 px-2 py-2"
              >
                {["Easy", "Medium", "Hard"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 mb-4 text-sm">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
              />
              Active (counts toward the 10-question test bank)
            </label>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-md border border-slate-300">
                Cancel
              </button>
              <button onClick={save} className="px-4 py-2 rounded-md bg-indigo-600 text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
