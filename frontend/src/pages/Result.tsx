import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AttemptResult } from "../types";

export default function Result() {
  const navigate = useNavigate();
  const [result, setResult] = useState<AttemptResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("last_result");
    if (!raw) {
      navigate("/");
      return;
    }
    setResult(JSON.parse(raw));
  }, [navigate]);

  if (!result) return null;

  const pass = result.status === "Pass";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow p-8 text-center">
        <div
          className={`inline-block px-4 py-1 rounded-full text-sm font-semibold mb-4 ${
            pass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {result.status}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Your Result</h1>
        <p className="text-slate-500 mb-6">{result.candidate_name}</p>

        <div className="grid grid-cols-2 gap-4 text-left mb-6">
          <Stat label="Net Score" value={result.score} />
          <Stat label="Percentage" value={`${result.percentage}%`} />
          <Stat label="Correct" value={result.correct_count} />
          <Stat label="Incorrect" value={result.incorrect_count} />
          <Stat label="Unattempted" value={result.unattempted_count} />
          <Stat label="Marks Deducted" value={result.marks_deducted} />
          <Stat label="Time Taken" value={`${Math.floor(result.time_taken_seconds / 60)}m ${result.time_taken_seconds % 60}s`} />
        </div>

        <p className="text-xs text-slate-400">Only one attempt is allowed per email.</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-50 rounded-md p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
