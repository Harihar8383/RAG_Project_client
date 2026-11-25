import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/clerk-react";
import { Loader2, X } from "lucide-react";
import apiClient from "../../utils/apiClient";

export default function QuizModal({ projectId, document: file, onClose }) {
  const { getToken } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);
  const [picked, setPicked] = useState({});
  const [checked, setChecked] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const token = await getToken();
        const res = await apiClient.post(
          `/projects/${projectId}/documents/${file._id}/quiz`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!cancelled) setQuiz(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || "The quiz could not be made. Try again.");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, file._id, getToken]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const questions = quiz?.questions || [];
  const score = questions.filter((q, i) => picked[i] === q.answer).length;
  const percentRead = quiz ? Math.round((quiz.readChars / quiz.totalChars) * 100) : 100;

  // A portal, because the clay panels around the sidebar would otherwise trap a fixed popup inside them.
  return createPortal(
    <div className="anim-fade-in fixed inset-0 z-[55] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-title"
        onClick={(e) => e.stopPropagation()}
        className="clay flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] p-5">
          <h2 id="quiz-title" className="truncate text-base font-semibold text-white">Quiz: {file.name}</h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close quiz" className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          {error ? (
            <p role="alert" className="text-sm text-rose-300">{error}</p>
          ) : !quiz ? (
            <p role="status" className="flex items-center gap-2 text-sm text-gray-300">
              <Loader2 size={16} className="animate-spin" /> Writing your quiz...
            </p>
          ) : (
            <>
              <p className="mb-4 text-xs text-amber-200/80">
                AI-written, so check the answers against your notes.
                {percentRead < 100 && ` This long file was sampled: about ${percentRead}% of its text was read.`}
              </p>
              {questions.map((q, i) => (
                <fieldset key={i} className="mb-5">
                  <legend className="mb-2 text-sm font-medium text-gray-100">{i + 1}. {q.question}</legend>
                  {q.options.map((option, j) => (
                    <label key={j} className="mb-1.5 flex cursor-pointer items-start gap-2 text-sm text-gray-300">
                      <input
                        type="radio"
                        name={`question-${i}`}
                        checked={picked[i] === j}
                        disabled={checked}
                        onChange={() => setPicked((prev) => ({ ...prev, [i]: j }))}
                        className="mt-1"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  {checked && (
                    <p className={`text-xs ${picked[i] === q.answer ? "text-emerald-300" : "text-rose-300"}`}>
                      {picked[i] === q.answer ? "Correct." : `Not correct. Answer: ${q.options[q.answer]}`}
                      {q.page != null ? ` (page ${q.page})` : ""}
                    </p>
                  )}
                </fieldset>
              ))}
              {checked ? (
                <div className="flex items-center justify-between gap-3">
                  <p role="status" className="text-sm font-semibold text-white">You scored {score} of {questions.length}.</p>
                  <button onClick={() => { setPicked({}); setChecked(false); }} className="btn-ghost rounded-xl px-4 py-2 text-sm text-gray-200">
                    Try again
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setChecked(true)}
                  disabled={Object.keys(picked).length < questions.length}
                  className="btn-primary rounded-xl px-5 py-2.5 text-sm"
                >
                  Check answers
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
