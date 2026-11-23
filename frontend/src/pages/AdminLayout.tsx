import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const icon = {
  dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  questions:
    "M9 2h6l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2h3zm5 1.5V8h4.5L14 3.5zM8 12h8v1.5H8V12zm0 3.5h8V17H8v-1.5z",
  results: "M5 9h3v10H5V9zm5.5-5h3v15h-3V4zM16 13h3v6h-3v-6z",
  settings:
    "M19.4 13a7.5 7.5 0 000-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 00-1.7-1L15 3.3h-4l-.4 2.6a7.6 7.6 0 00-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 000 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.6h4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5-2.1-1.6zM13 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z",
};

const links = [
  { to: "/admin/dashboard", label: "Dashboard", path: icon.dashboard },
  { to: "/admin/questions", label: "Questions", path: icon.questions },
  { to: "/admin/results", label: "Results", path: icon.results },
  { to: "/admin/settings", label: "Settings", path: icon.settings },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // mobile drawer

  function logout() {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Mobile top strip: only shows the menu button below the md breakpoint */}
      <div className="md:hidden flex items-center gap-3 bg-slate-900 text-white px-4 py-3">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1 rounded hover:bg-slate-800">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
          </svg>
        </button>
        <span className="font-semibold">Admin Panel</span>
      </div>

      {open && <div className="md:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-slate-900 text-slate-300 flex flex-col transform transition-transform md:static md:translate-x-0 md:min-h-screen md:sticky md:top-0 md:h-screen ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-800">
          <p className="text-white font-semibold">Aptitude Assessment</p>
          <p className="text-xs text-slate-400 mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon d={l.path} />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-slate-800 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
              <path d="M10 17l1.4-1.4L8.8 13H20v-2H8.8l2.6-2.6L10 7l-5 5 5 5zM4 5h8V3H4a2 2 0 00-2 2v14a2 2 0 002 2h8v-2H4V5z" />
            </svg>
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
