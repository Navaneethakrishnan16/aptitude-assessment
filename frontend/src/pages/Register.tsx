import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Candidate, CandidateForm } from "../types";

const QUALIFICATIONS = ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "Doctorate"];

const EMPTY_FORM: CandidateForm = {
  full_name: "",
  email: "",
  age: "",
  phone: "",
  gender: "",
  qualification: "",
  city: "",
};

export default function Register() {
  const [form, setForm] = useState<CandidateForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Real-time validation function
  function validateField(name: keyof CandidateForm, value: string): string {
    switch (name) {
      case "full_name":
        if (!/^[A-Za-z ]{3,50}$/.test(value.trim())) return "3-50 characters, letters and spaces only";
        break;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address";
        break;
      case "age":
        const age = Number(value);
        if (!value || Number.isNaN(age) || age < 0 || age > 100) return "Age must be between 0 and 100";
        break;
      case "phone":
        if (!/^\d{10}$/.test(value)) return "Phone number must be exactly 10 digits";
        break;
      case "qualification":
        if (!value) return "Please select your highest qualification";
        break;
    }
    return "";
  }

  function handleChange(name: keyof CandidateForm, value: string) {
    // 1. Force phone to be strictly digits and max 10 chars
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    setForm({ ...form, [name]: value });

    // 2. Run real-time validation and update errors
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    (Object.keys(form) as Array<keyof CandidateForm>).forEach((key) => {
      // Skip optional fields for form submission validation
      if (key === "gender" || key === "city") return;
      const err = validateField(key, form[key]);
      if (err) next[key] = err;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const candidate = await api.post<Candidate>("/api/candidates", {
        ...form,
        age: Number(form.age),
        gender: form.gender || null,
        city: form.city || null,
      });
      sessionStorage.setItem("candidate_id", String(candidate.id));
      sessionStorage.setItem("candidate_name", candidate.full_name);
      navigate("/instructions");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // Generic field renderer
  function field(name: keyof CandidateForm, label: string, type = "text") {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input
          type={type}
          value={form[name]}
          onChange={(e) => handleChange(name, e.target.value)}
          // Add maxLength for phone directly to the input
          maxLength={name === "phone" ? 10 : undefined}
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors[name] && <p className="text-sm text-red-600 mt-1">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Aptitude Assessment</h1>
        <p className="text-slate-500 mb-6">Register to begin your test.</p>

        {serverError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {serverError}
          </div>
        )}

        {field("full_name", "Full Name")}
        {field("email", "Email ID", "email")}
        {field("age", "Age", "number")}

        {/* Custom Phone Field with +91 Prefix */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
              +91
            </span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              maxLength={10}
              placeholder="10-digit mobile number"
              className="flex-1 w-full rounded-none rounded-r-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Gender (optional)</label>
          <select
            value={form.gender}
            onChange={(e) => handleChange("gender", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Highest Qualification</label>
          <select
            value={form.qualification}
            onChange={(e) => handleChange("qualification", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Select...</option>
            {QUALIFICATIONS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
          {errors.qualification && <p className="text-sm text-red-600 mt-1">{errors.qualification}</p>}
        </div>

        {field("city", "City (optional)")}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-md disabled:opacity-50"
        >
          {submitting ? "Registering..." : "Continue"}
        </button>
      </form>
    </div>
  );
}