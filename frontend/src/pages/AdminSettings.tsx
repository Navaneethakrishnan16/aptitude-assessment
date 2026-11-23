import { useEffect, useState } from "react";
import { api } from "../api/client";

interface SettingsOut {
  test_duration_minutes: number;
  pass_percentage: number;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingsOut | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<SettingsOut>("/api/settings").then(setSettings);
  }, []);

  async function save() {
    if (!settings) return;
    await api.put("/api/admin/settings", settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return null;

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      <div className="bg-white rounded-xl shadow p-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">Test Duration (minutes)</label>
        <input
          type="number"
          value={settings.test_duration_minutes}
          onChange={(e) => setSettings({ ...settings, test_duration_minutes: Number(e.target.value) })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 mb-4"
        />
        <label className="block text-sm font-medium text-slate-700 mb-1">Pass Percentage</label>
        <input
          type="number"
          value={settings.pass_percentage}
          onChange={(e) => setSettings({ ...settings, pass_percentage: Number(e.target.value) })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 mb-6"
        />
        <button onClick={save} className="px-4 py-2 rounded-md bg-indigo-600 text-white">
          Save
        </button>
        {saved && <span className="ml-3 text-green-600 text-sm">Saved!</span>}
      </div>
    </div>
  );
}
