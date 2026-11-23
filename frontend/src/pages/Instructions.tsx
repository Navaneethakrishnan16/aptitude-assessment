import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

interface SettingsOut {
  test_duration_minutes: number;
  pass_percentage: number;
}

export default function Instructions() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsOut | null>(null);

  useEffect(() => {
    if (!sessionStorage.getItem("candidate_id")) {
      navigate("/");
      return;
    }
    api.get<SettingsOut>("/api/settings").then(setSettings).catch(() => {
      setSettings({ test_duration_minutes: 15, pass_percentage: 60 });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Test Instructions</h1>
        <ul className="space-y-3 text-slate-700 mb-8">
          <li>• The test has <strong>10 questions</strong>, one at a time.</li>
          <li>
            • Time limit: <strong>{settings?.test_duration_minutes ?? 15} minutes</strong>. The test
            auto-submits when time runs out.
          </li>
          <li>
            • Marking scheme: <strong>+2</strong> for a correct answer, <strong>-1</strong> for a wrong
            answer, <strong>0</strong> for an unattempted question.
          </li>
          <li>• You can navigate freely with Previous/Next, or jump via the question palette.</li>
          <li>• Your answers are saved as you go, so an accidental refresh won't lose your progress.</li>
          <li>• Pass mark: <strong>{settings?.pass_percentage ?? 60}%</strong>.</li>
        </ul>
        <button
          onClick={() => navigate("/test")}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-md"
        >
          Start Test
        </button>
      </div>
    </div>
  );
}
