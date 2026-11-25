import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  MessageSquareText,
  PenLine,
  Search,
  Square,
  User,
} from "lucide-react";
import apiClient from "../../utils/apiClient";
import { readEventStream } from "../../utils/sse";
import FormattedText from "./FormattedText";
import Logo from "../ui/Logo";
import Skeleton from "../ui/Skeleton";
import { useToast } from "../ui/toast-context";

const INTERRUPTED = "This answer was interrupted.";
const MESSAGE_LIMIT = 4000;
const CONNECTION_LOST = "The connection to the server was lost before the answer finished. Please ask again.";

// Each answer reads only the 5 best-matching passages, so whole-document requests such as "summarize" are not offered.
const SUGGESTIONS = [{ icon: Search, text: "List any dates, names or numbers that matter" }];

function SourceList({ sources }) {
  const [openLabel, setOpenLabel] = useState(null);
  const box = useRef(null);

  // A click outside the list, or the Escape key, closes the open popup.
  useEffect(() => {
    if (!openLabel) return undefined;
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpenLabel(null);
    };
    const onKey = (e) => e.key === "Escape" && setOpenLabel(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openLabel]);

  if (!sources || sources.length === 0) return null;
  const open = sources.find((s) => s.label === openLabel);

  return (
    <div ref={box} className="relative mt-4 border-t border-white/10 pt-3" data-testid="sources">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">Sources</p>
      <ul className="stagger flex flex-wrap gap-2">
        {sources.map((s, i) => (
          <li key={s.label} style={{ "--i": i }}>
            <button
              type="button"
              aria-expanded={openLabel === s.label}
              onClick={() => setOpenLabel(openLabel === s.label ? null : s.label)}
              className={`rounded-lg border px-2.5 py-1 text-xs text-gray-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400/60 hover:bg-brand-500/10 ${
                openLabel === s.label ? "border-brand-400/70 bg-brand-500/15" : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <span className="font-semibold text-brand-400">{s.label}</span> {s.fileName}
              {s.page != null ? ` (page ${s.page})` : ""}
            </button>
          </li>
        ))}
      </ul>
      {open && (
        <div role="dialog" aria-label={`Source ${open.label}`} className="anim-scale-in clay absolute left-0 top-full z-20 mt-2 w-80 max-w-[80vw] rounded-xl p-4 text-left">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400">
              <FileText size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{open.fileName}</p>
              <p className="text-xs text-gray-400">{open.page != null ? `Page ${open.page}` : "Whole file"}</p>
            </div>
          </div>
          {open.text ? (
            <blockquote className="max-h-48 overflow-y-auto whitespace-pre-wrap border-l-2 border-brand-400/60 pl-3 text-xs leading-relaxed text-gray-300">
              {open.text}
            </blockquote>
          ) : (
            <p className="text-xs leading-relaxed text-gray-400">
              The answer marks this passage with the badge <b className="text-brand-400">{open.label}</b>. Manage the file in the Knowledge Base on the right.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Shows the two stages that the server reports before the first word of the answer arrives.
function Pipeline({ status }) {
  const steps = [
    { key: "retrieving", label: "Searching your documents", icon: Search },
    { key: "generating", label: "Writing the answer", icon: PenLine },
  ];
  const activeIndex = status === "generating" ? 1 : 0;
  return (
    <div role="status" className="min-w-[15rem]">
      <span className="sr-only">Thinking...</span>
      <ul className="space-y-2.5">
        {steps.map((step, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={step.key} className={`flex items-center gap-2.5 text-sm transition-colors duration-300 ${done ? "text-emerald-300" : active ? "text-gray-100" : "text-gray-600"}`}>
              {done ? (
                <CheckCircle2 size={16} className="anim-pop" />
              ) : active ? (
                <Loader2 size={16} className="animate-spin text-brand-400" />
              ) : (
                <step.icon size={16} />
              )}
              {step.label}
              {active && (
                <span className="ml-1 flex gap-1" aria-hidden="true">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="progress-track progress-indeterminate mt-3" aria-hidden="true" />
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Answer copied.");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy the answer.");
    }
  };

  return (
    <button
      onClick={copy}
      aria-label="Copy answer"
      className="rounded-lg p-1.5 text-gray-500 opacity-0 transition-all hover:bg-white/10 hover:text-white focus:opacity-100 group-hover/msg:opacity-100"
    >
      {copied ? <Check size={14} className="anim-pop text-emerald-300" /> : <Copy size={14} />}
    </button>
  );
}

export default function ChatInterface({ onFirstQuestion }) {
  const { projectId, chatId } = useParams();
  const { getToken } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | retrieving | generating
  const [error, setError] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const abortRef = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const base = `/projects/${projectId}/chats/${chatId}/messages`;

  // Load the stored conversation when the chat opens
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingHistory(true);
      try {
        const token = await getToken();
        const res = await apiClient.get(base, { headers: { Authorization: `Bearer ${token}` } });
        if (!cancelled) {
          setMessages(
            res.data.map((m) => ({ role: m.role, content: m.content, sources: m.sources || [], incomplete: !!m.incomplete }))
          );
        }
      } catch {
        if (!cancelled) setError("Failed to load the conversation.");
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [base, getToken]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, status]);

  // The input grows with its text, up to about six lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight || 0, 160)}px`;
  }, [input]);

  const updateLast = (patch) =>
    setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, ...(typeof patch === "function" ? patch(m) : patch) } : m)));

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || status !== "idle") return;
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content }, { role: "assistant", content: "", sources: [], incomplete: false }]);
    setStatus("retrieving");

    const controller = new AbortController();
    abortRef.current = controller;
    let accepted = false; // true once the server has stored the question
    try {
      const token = await getToken();
      const res = await fetch(`${apiClient.defaults.baseURL}${base}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "The question could not be sent.");
      }
      accepted = true;
      if (messages.length === 0) onFirstQuestion?.(content);
      let finished = false;
      await readEventStream(res, (event) => {
        if (event.status) setStatus(event.status);
        if (event.chunk) updateLast((m) => ({ content: m.content + event.chunk }));
        if (event.sources) updateLast({ sources: event.sources });
        if (event.error) {
          finished = true;
          updateLast({ incomplete: true });
          setError(event.error);
        }
        if (event.done) finished = true;
      });
      if (!finished) {
        updateLast({ incomplete: true });
        setError(CONNECTION_LOST);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        updateLast({ incomplete: true });
      } else if (!accepted) {
        // The server did not store the question, so give the text back instead of losing it.
        setMessages((prev) => prev.slice(0, -2));
        setInput((typed) => typed || content);
        // fetch rejects with a TypeError ("Failed to fetch", "network error") when the server cannot be reached.
        setError(err instanceof TypeError ? "Could not reach the server. Check your connection and try again." : err.message || "The question could not be sent.");
      } else {
        setMessages((prev) => (prev.length && prev[prev.length - 1].role === "assistant" && !prev[prev.length - 1].content ? prev.slice(0, -1) : prev));
        setError(CONNECTION_LOST);
      }
    } finally {
      abortRef.current = null;
      setStatus("idle");
    }
  }, [input, status, getToken, base, messages.length, onFirstQuestion]);

  const stop = () => abortRef.current?.abort();

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const pickSuggestion = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const busy = status !== "idle";
  const lastIndex = messages.length - 1;
  const nearLimit = input.length > MESSAGE_LIMIT * 0.85;

  return (
    <div className="clay relative flex flex-1 flex-col overflow-hidden rounded-2xl">
      <div className="relative flex items-center gap-3 border-b border-white/[0.07] px-5 py-3.5">
        <Link
          to={`/projects/${projectId}`}
          aria-label="Back to conversations"
          className="rounded-lg p-1.5 text-gray-400 transition-all hover:-translate-x-0.5 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={18} />
        </Link>
        <Logo showText={false} size={30} />
        <h2 className="text-sm font-semibold text-gray-100">Conversation</h2>
        {busy && (
          <span className="anim-fade-in ml-auto flex items-center gap-2 rounded-full bg-brand-500/15 px-3 py-1 text-xs text-brand-400">
            <Loader2 size={12} className="animate-spin" />
            {status === "generating" ? "Writing the answer" : "Searching your documents"}
          </span>
        )}
        {busy && <div className="progress-track progress-indeterminate absolute inset-x-0 bottom-0 h-[2px] rounded-none" aria-hidden="true" />}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-8">
        {loadingHistory ? (
          <div role="status" aria-label="Loading conversation" className="space-y-5">
            <Skeleton className="ml-auto h-10 w-2/5" />
            <Skeleton className="h-20 w-3/5" />
            <Skeleton className="ml-auto h-10 w-1/3" />
          </div>
        ) : messages.length === 0 ? (
          <div className="anim-fade-up flex h-full flex-col items-center justify-center text-center">
            <div className="clay mb-6 flex h-20 w-20 items-center justify-center rounded-3xl">
              <MessageSquareText size={30} className="text-brand-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-100">Start the conversation</h3>
            <p className="mt-2 max-w-sm text-sm text-gray-400">Ask a question about the documents in your knowledge base to get started.</p>
            <ul className="stagger mt-7 flex max-w-xl flex-wrap justify-center gap-2.5">
              {SUGGESTIONS.map((s, i) => (
                <li key={s.text} style={{ "--i": i + 2 }}>
                  <button
                    onClick={() => pickSuggestion(s.text)}
                    className="btn-ghost flex items-center gap-2 rounded-full px-4 py-2 text-sm text-gray-200 hover:-translate-y-0.5"
                  >
                    <s.icon size={14} className="text-brand-400" />
                    {s.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.role === "user";
            const live = busy && i === lastIndex;
            return (
              <div key={i} className={`group/msg anim-fade-up flex gap-3 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  <Logo showText={false} size={32} className="mt-1 shrink-0 self-start" />
                )}
                <div className={`flex max-w-[82%] items-start gap-1 ${mine ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      mine
                        ? "rounded-br-md fill-accent"
                        : "clay rounded-tl-md text-gray-200"
                    }`}
                  >
                    {!mine && !m.content && live ? (
                      <Pipeline status={status} />
                    ) : !mine ? (
                      <FormattedText text={m.content} streaming={live && status === "generating"} />
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                    {!mine && m.incomplete && !busy && (
                      <p className="mt-2 text-xs text-amber-300">{INTERRUPTED}</p>
                    )}
                    {!mine && <SourceList sources={m.sources} />}
                  </div>
                  {!mine && m.content && !live && <CopyButton text={m.content} />}
                </div>
                {mine && (
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-gray-300">
                    <User size={16} />
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p role="alert" className="anim-fade-up mx-5 mb-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="border-t border-white/[0.07] p-4">
        <div className="input-glow flex items-end gap-2 rounded-2xl p-2 focus-within:border-brand-400/70 focus-within:ring-4 focus-within:ring-brand-500/15">
          <textarea
            ref={inputRef}
            aria-label="Message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MESSAGE_LIMIT}
            placeholder="Ask me anything..."
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none"
          />
          {busy ? (
            <button
              onClick={stop}
              aria-label="Stop"
              className="rounded-xl bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              onClick={send}
              aria-label="Send"
              disabled={!input.trim()}
              className="btn-primary group rounded-xl p-3"
            >
              <ArrowUp size={16} className="transition-transform duration-200 group-hover:-translate-y-0.5" />
            </button>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-gray-500">
          <span>Enter to send. Shift and Enter for a new line.</span>
          {nearLimit && (
            <span className={input.length >= MESSAGE_LIMIT ? "text-rose-300" : "text-amber-300"}>
              {input.length}/{MESSAGE_LIMIT}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
