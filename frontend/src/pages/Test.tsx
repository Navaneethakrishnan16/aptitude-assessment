import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useTimer } from "../hooks/useTimer";
import { QuestionPublic, QuestionStatus, StartTestResponse } from "../types";

interface PersistedState {
  attemptId: number;
  questions: QuestionPublic[];
  answers: Record<number, string | null>;
  marked: number[];
  durationMinutes: number;
  startedAtMs: number;
}

const STORAGE_KEY = "aptitude_test_state";

export default function Test() {
  const navigate = useNavigate();
  const [state, setState] = useState<PersistedState | null>(null);
  const [loadError, setLoadError] = useState("");

  // Load an in-progress attempt (survives refresh) or start a new one.
  useEffect(() => {
    const candidateId = sessionStorage.getItem("candidate_id");
    if (!candidateId) {
      navigate("/");
      return;
    }

    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      setState(JSON.parse(saved));
      return;
    }

    api
      .post<StartTestResponse>(`/api/tests/start/${candidateId}`)
      .then((resp) => {
        const fresh: PersistedState = {
          attemptId: resp.attempt_id,
          questions: resp.questions,
          answers: {},
          marked: [],
          durationMinutes: resp.duration_minutes,
          startedAtMs: Date.now(),
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        setState(fresh);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Could not start test"));
  }, [navigate]);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-md">
          <p className="text-red-600 font-medium mb-4">{loadError}</p>
          <button onClick={() => navigate("/")} className="text-indigo-600 underline">
            Back to registration
          </button>
        </div>
      </div>
    );
  }

  if (!state) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading test...</div>;
  }

  // Keying on attemptId forces a fresh mount (and a correctly-initialized timer)
  // exactly once per attempt, instead of once per Test-page mount.
  return <TestRunner key={state.attemptId} initialState={state} onFatalError={setLoadError} />;
}

function TestRunner({
  initialState,
  onFatalError,
}: {
  initialState: PersistedState;
  onFatalError: (msg: string) => void;
}) {
  const navigate = useNavigate();
  const [state, setState] = useState(initialState);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const persist = useCallback((next: PersistedState) => {
    setState(next);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const totalSeconds = state.durationMinutes * 60;
  const elapsedAtLoad = Math.floor((Date.now() - state.startedAtMs) / 1000);
  // Computed once, synchronously, before TestRunner's first render — this is
  // the value useTimer's internal useState actually gets initialized with.
  const initialRemaining = Math.max(totalSeconds - elapsedAtLoad, 1);

  const submitTest = useCallback(
    async (timeTakenSeconds: number) => {
      setSubmitting((already) => {
        if (already) return already;
        return true;
      });
      try {
        const answers = state.questions.map((q) => ({
          question_id: q.id,
          selected_option: state.answers[q.id] ?? null,
        }));
        const result = await api.post("/api/tests/submit", {
          attempt_id: state.attemptId,
          answers,
          time_taken_seconds: timeTakenSeconds,
        });
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.setItem("last_result", JSON.stringify(result));
        navigate("/result");
      } catch (err) {
        onFatalError(err instanceof Error ? err.message : "Submission failed");
        setSubmitting(false);
      }
    },
    [state, navigate, onFatalError]
  );

  const { secondsLeft, label } = useTimer(initialRemaining, () => {
    submitTest(totalSeconds);
  });

  const unansweredCount = useMemo(
    () => state.questions.filter((q) => !state.answers[q.id]).length,
    [state]
  );

  const question = state.questions[currentIndex];

  function statusFor(index: number): QuestionStatus {
    const q = state.questions[index];
    if (state.marked.includes(q.id)) return "marked";
    if (state.answers[q.id]) return "answered";
    return "unanswered";
  }

  function selectOption(option: string) {
    persist({ ...state, answers: { ...state.answers, [question.id]: option } });
  }

  function toggleMark() {
    const marked = state.marked.includes(question.id)
      ? state.marked.filter((id) => id !== question.id)
      : [...state.marked, question.id];
    persist({ ...state, marked });
  }

  const paletteColor: Record<QuestionStatus, string> = {
    answered: "bg-green-500 text-white",
    marked: "bg-amber-400 text-white",
    unanswered: "bg-slate-200 text-slate-700",
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500">
              Question {currentIndex + 1} of {state.questions.length}
            </span>
            <span className="font-mono text-lg font-semibold text-indigo-700">⏱ {label}</span>
          </div>

          <p className="text-lg text-slate-900 mb-6">{question.text}</p>

          <div className="space-y-3 mb-8">
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const text = { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d }[opt];
              const selected = state.answers[question.id] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => selectOption(opt)}
                  className={`w-full text-left px-4 py-3 rounded-md border ${
                    selected ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="font-medium mr-2">{opt}.</span>
                  {text}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between">
            <div className="space-x-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="px-4 py-2 rounded-md border border-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button onClick={toggleMark} className="px-4 py-2 rounded-md border border-amber-400 text-amber-600">
                {state.marked.includes(question.id) ? "Unmark" : "Mark for review"}
              </button>
            </div>
            {currentIndex < state.questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="px-4 py-2 rounded-md bg-emerald-600 text-white"
              >
                Submit Test
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 h-fit">
          <h2 className="font-semibold text-slate-800 mb-4">Question Palette</h2>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {state.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-9 rounded-md text-sm font-medium ${paletteColor[statusFor(idx)]} ${
                  idx === currentIndex ? "ring-2 ring-indigo-600" : ""
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="text-xs space-y-1 text-slate-500">
            <div><span className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-2" />Answered</div>
            <div><span className="inline-block w-3 h-3 bg-amber-400 rounded-sm mr-2" />Marked for review</div>
            <div><span className="inline-block w-3 h-3 bg-slate-200 rounded-sm mr-2" />Unanswered</div>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full mt-6 px-4 py-2 rounded-md bg-slate-800 text-white text-sm"
          >
            Submit Test
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow p-6 max-w-sm w-full">
            <h3 className="font-semibold text-lg mb-2">Submit test?</h3>
            <p className="text-slate-600 mb-6">
              You have <strong>{unansweredCount}</strong> unanswered question{unansweredCount !== 1 ? "s" : ""}.
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-md border border-slate-300">
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={() => submitTest(totalSeconds - secondsLeft)}
                className="px-4 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
