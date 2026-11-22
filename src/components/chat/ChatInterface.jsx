import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { ArrowLeft, Bot, Loader2, MessageSquare, Send, Square, User } from "lucide-react";
import apiClient from "../../utils/apiClient";
import { readEventStream } from "../../utils/sse";
import FormattedText from "./FormattedText";

const INTERRUPTED = "This answer was interrupted.";

function SourceList({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t border-gray-700" data-testid="sources">
      <p className="text-xs font-medium text-gray-400 mb-2">Sources</p>
      <ul className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <li key={s.label} className="text-xs bg-[#252525] border border-gray-700 rounded px-2 py-1 text-gray-300">
            <span className="text-blue-400 font-medium">{s.label}</span> {s.fileName}
            {s.page != null ? ` (page ${s.page})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ChatInterface() {
  const { projectId, chatId } = useParams();
  const { getToken } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | retrieving | generating
  const [error, setError] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const abortRef = useRef(null);
  const endRef = useRef(null);

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
      if (!finished) updateLast({ incomplete: true });
    } catch (err) {
      if (err.name === "AbortError") {
        updateLast({ incomplete: true });
      } else {
        setMessages((prev) => (prev.length && prev[prev.length - 1].role === "assistant" && !prev[prev.length - 1].content ? prev.slice(0, -1) : prev));
        setError(err.message || "The question could not be sent.");
      }
    } finally {
      abortRef.current = null;
      setStatus("idle");
    }
  }, [input, status, getToken, base]);

  const stop = () => abortRef.current?.abort();

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const busy = status !== "idle";
  const lastIndex = messages.length - 1;

  return (
    <div className="flex-1 flex flex-col bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-700">
      <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-3">
        <Link to={`/projects/${projectId}`} aria-label="Back to conversations" className="text-gray-400 hover:text-gray-200">
          <ArrowLeft size={18} />
        </Link>
        <h2 className="text-sm font-medium text-gray-100">Conversation</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loadingHistory ? (
          <p className="text-gray-400 text-sm">Loading conversation...</p>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageSquare size={28} className="text-gray-500 mb-3" />
            <h3 className="text-gray-200 font-medium">Start the conversation</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">Ask a question about the documents in your knowledge base to get started.</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && <Bot size={18} className="text-gray-400 mt-2 shrink-0" />}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  m.role === "user" ? "bg-white text-black" : "bg-[#202020] text-gray-200"
                }`}
              >
                {m.role === "assistant" && !m.content && busy && i === lastIndex ? (
                  <span className="flex items-center gap-2 text-gray-400">
                    <Loader2 size={14} className="animate-spin" /> Thinking...
                  </span>
                ) : m.role === "assistant" ? (
                  <FormattedText text={m.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
                {m.role === "assistant" && m.incomplete && !busy && (
                  <p className="mt-2 text-xs text-amber-400">{INTERRUPTED}</p>
                )}
                {m.role === "assistant" && <SourceList sources={m.sources} />}
              </div>
              {m.role === "user" && <User size={18} className="text-gray-400 mt-2 shrink-0" />}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p role="alert" className="px-6 pb-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="p-4 border-t border-gray-700 flex gap-2 items-end">
        <textarea
          aria-label="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask me anything..."
          className="flex-1 resize-none max-h-32 bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        {busy ? (
          <button onClick={stop} aria-label="Stop" className="p-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600">
            <Square size={16} />
          </button>
        ) : (
          <button
            onClick={send}
            aria-label="Send"
            disabled={!input.trim()}
            className="p-3 rounded-lg bg-white text-black disabled:bg-gray-600 disabled:text-gray-400"
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
