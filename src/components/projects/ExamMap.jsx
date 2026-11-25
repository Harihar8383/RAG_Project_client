import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { ArrowLeft, Download, Loader2, Map as MapIcon } from "lucide-react";
import apiClient from "../../utils/apiClient";
import Skeleton from "../ui/Skeleton";
import { LABELS, labelOf, revisionList } from "../../utils/examLabels";

const MAX_TOPICS = 50;
const MAX_TEXT = 10000;

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  link.click();
  URL.revokeObjectURL(url);
}

export default function ExamMap() {
  const { projectId } = useParams();
  const { getToken } = useAuth();
  const [text, setText] = useState("");
  const [map, setMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);

  const url = `/projects/${projectId}/exam-map`;
  const auth = async () => ({ headers: { Authorization: `Bearer ${await getToken()}` } });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiClient.get(url, await auth());
        if (!cancelled) setMap(res.data || null);
      } catch {
        if (!cancelled) setError("Could not load the last Exam Map.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, getToken]);

  const check = async (e) => {
    e.preventDefault();
    setError(null);
    setIsChecking(true);
    try {
      const res = await apiClient.post(url, { text }, await auth());
      setMap(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "The Exam Map could not be made. Try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const correct = async (item, value) => {
    const override = value || null;
    const setOverride = (next) =>
      setMap((prev) => ({ ...prev, items: prev.items.map((i) => (i._id === item._id ? { ...i, override: next } : i)) }));
    setError(null);
    setOverride(override);
    try {
      await apiClient.patch(`${url}/${map._id}/items/${item._id}`, { label: override }, await auth());
    } catch {
      setOverride(item.override ?? null);
      setError("Could not save your correction.");
    }
  };

  const items = map?.items || [];
  const count = (label) => items.filter((i) => labelOf(i) === label).length;
  const open = revisionList(items);

  return (
    <div className="clay flex flex-1 flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-3.5">
        <Link to={`/projects/${projectId}`} aria-label="Back to conversations" className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <MapIcon size={18} className="text-brand-400" />
        <h2 className="text-sm font-semibold text-gray-100">Exam Map</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-7">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={check}>
            <label htmlFor="topics" className="mb-2 block text-sm text-gray-300">
              Paste your syllabus or exam questions, one per line (up to {MAX_TOPICS}).
            </label>
            <textarea
              id="topics"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_TEXT}
              rows={6}
              placeholder={"1. Process scheduling\n2. What causes a deadlock?"}
              className="input-glow w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600"
            />
            <button type="submit" disabled={!text.trim() || isChecking} className="btn-primary mt-3 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
              {isChecking && <Loader2 size={16} className="animate-spin" />}
              {isChecking ? "Checking your notes..." : "Check my notes"}
            </button>
            {map && <p className="mt-2 text-xs text-gray-500">A new check replaces the result below, with your corrections.</p>}
          </form>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
              {error}
            </p>
          )}

          {isLoading ? (
            <Skeleton className="mt-6 h-24 w-full" />
          ) : (
            map && (
              <section aria-label="Exam Map result" className="mt-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-200">
                    {Object.keys(LABELS).map((label) => `${count(label)} ${LABELS[label].text.toLowerCase()}`).join(" · ")}
                  </p>
                  <button
                    onClick={() => download("revision-list.txt", open)}
                    disabled={!open}
                    className="btn-ghost flex items-center gap-2 rounded-xl px-4 py-2 text-xs text-gray-200"
                  >
                    <Download size={14} /> Download revision list
                  </button>
                </div>
                <p className="mt-2 text-xs text-amber-200/80">
                  This is an estimate. A match does not prove your notes cover a topic, and a missing match does not prove they
                  do not. Open the passage and judge it yourself.
                </p>
                {map.skippedFiles?.length > 0 && (
                  <p className="mt-2 text-xs text-gray-400">Not searched, because they were not ready: {map.skippedFiles.join(", ")}</p>
                )}
                <ul className="mt-4 space-y-3">
                  {items.map((item) => (
                    <li key={item._id} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="min-w-0 flex-1 text-sm font-medium text-gray-100">{item.topic}</p>
                        <select
                          aria-label={`Label for ${item.topic}`}
                          value={item.override || ""}
                          onChange={(e) => correct(item, e.target.value)}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${LABELS[labelOf(item)].className}`}
                        >
                          <option value="" className="bg-ink-900 text-white">{LABELS[item.label].text}</option>
                          {Object.keys(LABELS)
                            .filter((label) => label !== item.label)
                            .map((label) => (
                              <option key={label} value={label} className="bg-ink-900 text-white">
                                {LABELS[label].text} (my choice)
                              </option>
                            ))}
                        </select>
                      </div>
                      {item.matched?.length > 0 && <p className="mt-1.5 text-xs text-gray-500">Matched words: {item.matched.join(", ")}</p>}
                      {item.passage && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-brand-400">
                            {item.fileName}
                            {item.page != null ? ` (page ${item.page})` : ""}
                          </summary>
                          <blockquote className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap border-l-2 border-brand-400/60 pl-3 text-xs leading-relaxed text-gray-300">
                            {item.passage}
                          </blockquote>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )
          )}
        </div>
      </div>
    </div>
  );
}
