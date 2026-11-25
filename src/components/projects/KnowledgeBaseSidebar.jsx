import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  FileText,
  File,
  FileSpreadsheet,
  Trash2,
  Loader2,
  CheckCircle2,
  RotateCw,
  Clock,
  AlertCircle,
  Database,
} from "lucide-react";
import { UploadDropzone } from "../../utils/uploadthing";
import apiClient from "../../utils/apiClient";
import Skeleton from "../ui/Skeleton";
import { useToast } from "../ui/toast-context";
import { useConfirm } from "../ui/confirm-context";

const POLL_INTERVAL_MS = 3000;

const STATUS_LABELS = {
  uploaded: { text: "Queued", icon: Clock, className: "text-gray-300 bg-white/[0.07]" },
  processing: { text: "Processing", icon: Loader2, spin: true, className: "text-sky-300 bg-sky-400/10" },
  indexed: { text: "Ready", icon: CheckCircle2, className: "text-emerald-300 bg-emerald-400/10" },
  failed: { text: "Failed", icon: AlertCircle, className: "text-rose-300 bg-rose-400/10" },
};

const getFileIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  if (extension === "pdf") return { Icon: FileText, tone: "bg-red-500/15 text-red-300" };
  if (["doc", "docx"].includes(extension)) return { Icon: File, tone: "bg-sky-500/15 text-sky-300" };
  if (["xls", "xlsx", "csv"].includes(extension)) return { Icon: FileSpreadsheet, tone: "bg-emerald-500/15 text-emerald-300" };
  return { Icon: File, tone: "bg-white/[0.08] text-gray-300" };
};

const isPending = (doc) => doc.status === "uploaded" || doc.status === "processing";

export default function KnowledgeBaseSidebar() {
  const { getToken } = useAuth();
  const { projectId } = useParams();
  const toast = useToast();
  const confirm = useConfirm();

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle | uploading | processing | done
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [freshIds, setFreshIds] = useState([]);

  // The last status seen for each document, so a change from pending to ready can raise a notice.
  const seen = useRef(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get(`/projects/${projectId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data;
      const previous = seen.current;
      if (previous) {
        const added = [];
        const nowReady = [];
        const nowFailed = [];
        list.forEach((d) => {
          const before = previous.get(d._id);
          if (before === undefined) added.push(d._id);
          else if (before !== d.status && (before === "uploaded" || before === "processing")) {
            if (d.status === "indexed") nowReady.push(d.name);
            if (d.status === "failed") nowFailed.push(d.name);
          }
        });
        if (added.length) setFreshIds((prev) => [...prev, ...added]);
        if (nowReady.length === 1) toast.success(`${nowReady[0]} is ready for questions.`);
        if (nowReady.length > 1) toast.success(`${nowReady.length} documents are ready for questions.`);
        if (nowFailed.length === 1) toast.error(`${nowFailed[0]} could not be indexed.`);
        if (nowFailed.length > 1) toast.error(`${nowFailed.length} documents could not be indexed.`);
      }
      seen.current = new Map(list.map((d) => [d._id, d.status]));
      setDocuments(list);
      setLoadError(false);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, projectId, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Refresh the list while any document is still being indexed, and stop when all are settled.
  const anyPending = documents.some(isPending);
  useEffect(() => {
    if (!anyPending) return undefined;
    const timer = setInterval(fetchDocuments, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [anyPending, fetchDocuments]);

  // The upload overlay timers are kept so that they can be cleared when the sidebar closes.
  const overlayTimers = useRef([]);
  useEffect(() => {
    const timers = overlayTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleUploadComplete = () => {
    setUploadStatus("processing");
    setUploadProgress(100);
    toast.info("Upload complete. Indexing has started.");
    const first = setTimeout(() => {
      setUploadStatus("done");
      fetchDocuments();
      overlayTimers.current.push(setTimeout(() => setUploadStatus("idle"), 1500));
    }, 1000);
    overlayTimers.current.push(first);
  };

  const handleUploadError = (err) => {
    setError(`Upload failed. ${err.message}`);
    setUploadStatus("idle");
  };

  const handleDelete = async (doc) => {
    const ok = await confirm({
      title: `Delete "${doc.name}"?`,
      message: "The file and its indexed content are removed. Answers can no longer cite it.",
      confirmText: "Delete document",
    });
    if (!ok) return;
    setError(null);
    try {
      const token = await getToken();
      await apiClient.delete(`/projects/${projectId}/documents/${doc._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments((prev) => prev.filter((d) => d._id !== doc._id));
      seen.current?.delete(doc._id);
      toast.success(`${doc.name} deleted.`);
    } catch {
      setError(`Could not delete ${doc.name}. Try again.`);
    }
  };

  const handleRetry = async (doc) => {
    setError(null);
    try {
      const token = await getToken();
      await apiClient.post(
        `/projects/${projectId}/documents/${doc._id}/retry`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDocuments((prev) =>
        prev.map((d) => (d._id === doc._id ? { ...d, status: "processing", failureReason: undefined } : d))
      );
      if (seen.current) seen.current.set(doc._id, "processing");
      toast.info(`Indexing ${doc.name} again.`);
    } catch {
      setError(`Could not retry ${doc.name}. Try again.`);
    }
  };

  const ready = documents.filter((d) => d.status === "indexed").length;
  const percentReady = documents.length ? Math.round((ready / documents.length) * 100) : 0;

  return (
    <div className="glass flex h-full w-full max-w-96 shrink-0 flex-col overflow-y-auto rounded-2xl lg:w-96">
      <div className="flex items-center gap-3 border-b border-white/[0.07] p-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-violet-500/20 text-brand-400">
          <Database size={17} />
        </span>
        <h2 className="text-base font-semibold text-gray-100">Knowledge Base</h2>
      </div>

      <div className="p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Add Sources</h3>

        <div className="relative">
          {uploadStatus === "uploading" && (
            <div className="anim-fade-in absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-ink-950/85 backdrop-blur-sm">
              <Loader2 className="mb-2 animate-spin text-brand-400" size={26} />
              <p className="text-sm font-medium text-brand-400">Uploading...</p>
              <div className="mt-3 w-2/3">
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Upload progress"
                >
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="mt-1.5 text-center text-xs tabular-nums text-gray-400">{Math.round(uploadProgress)}%</p>
              </div>
            </div>
          )}

          {uploadStatus === "processing" && (
            <div className="anim-fade-in absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-ink-950/85 backdrop-blur-sm">
              <Loader2 className="mb-2 animate-spin text-emerald-300" size={26} />
              <p className="text-sm font-medium text-emerald-300">Processing file...</p>
              <div className="progress-track progress-indeterminate mt-3 w-2/3" aria-hidden="true" />
            </div>
          )}

          {uploadStatus === "done" && (
            <div className="anim-fade-in absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-ink-950/80 backdrop-blur-sm">
              <CheckCircle2 className="anim-pop mb-2 text-emerald-300" size={34} />
              <p className="text-sm font-medium text-emerald-300">Upload Complete!</p>
            </div>
          )}

          <UploadDropzone
            endpoint="documentUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            onUploadProgress={(p) => {
              setUploadStatus("uploading");
              setUploadProgress(p);
            }}
            headers={async () => {
              const token = await getToken();
              return token ? { Authorization: `Bearer ${token}` } : {};
            }}
            input={{ projectId }}
            content={{ allowedContent: "PDF, DOCX, TXT or CSV files" }}
            appearance={{
              // UploadThing adds its own default classes. The trailing ! makes these classes win over them.
              container: ({ isDragActive }) =>
                isDragActive
                  ? "flex! cursor-pointer! flex-col! items-center! justify-center! rounded-xl! border-2! border-dashed! border-brand-400! bg-brand-500/15! p-6! text-center! scale-[1.02] shadow-[0_0_40px_-6px_rgba(91,124,250,0.6)]! transition-all! duration-300!"
                  : "flex! cursor-pointer! flex-col! items-center! justify-center! rounded-xl! border-2! border-dashed! border-white/15! bg-white/[0.03]! p-6! text-center! transition-all! duration-300! hover:border-brand-400/60! hover:bg-white/[0.06]!",
              label: "mt-2! text-sm! font-medium! text-gray-200!",
              allowedContent: "mt-1! text-xs! text-gray-400!",
              uploadIcon: "mb-2! h-14! w-14! text-brand-400!",
              button: "btn-primary mt-3! rounded-xl! px-5! py-2.5! text-sm! text-white! disabled:opacity-100! after:hidden!",
            }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-amber-200/80">
          Files are read by Google Gemini to answer questions. Do not upload sensitive or personal files.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-white/[0.07] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sources</h3>
          <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-xs text-gray-300">{documents.length}</span>
        </div>

        {documents.length > 0 && (
          <div className="anim-fade-in mb-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
              <span>
                {ready} of {documents.length} ready
              </span>
              <span className="tabular-nums">{percentReady}%</span>
            </div>
            <div className="progress-track">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-700"
                style={{ width: `${percentReady}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="anim-fade-up mb-3 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div role="status" aria-label="Loading documents" className="space-y-2.5">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : loadError && documents.length === 0 ? (
            <p role="alert" className="py-10 text-center text-sm text-rose-300">
              Could not load your documents. Reload the page to try again.
            </p>
          ) : documents.length === 0 ? (
            <div className="anim-fade-up py-10 text-center">
              <div className="anim-float mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] ring-1 ring-white/10">
                <FileText size={22} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">No documents uploaded yet.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {documents.map((doc) => {
                const badge = STATUS_LABELS[doc.status] || STATUS_LABELS.uploaded;
                const BadgeIcon = badge.icon;
                const { Icon, tone } = getFileIcon(doc.name);
                return (
                  <li
                    key={doc._id}
                    className={`group relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] transition-colors hover:border-white/15 hover:bg-white/[0.06] ${
                      freshIds.includes(doc._id) ? "anim-slide-right anim-flash-new" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-100">{doc.name}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          <span
                            data-testid={`status-${doc._id}`}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                          >
                            <BadgeIcon size={11} className={badge.spin ? "animate-spin" : doc.status === "indexed" ? "anim-pop" : ""} />
                            {badge.text}
                          </span>
                        </p>
                        {doc.status === "failed" && doc.failureReason && (
                          <p className="mt-1 text-xs text-rose-300">{doc.failureReason}</p>
                        )}
                      </div>
                      {doc.status === "failed" && (
                        <button
                          onClick={() => handleRetry(doc)}
                          aria-label={`Retry ${doc.name}`}
                          className="rounded-lg p-1.5 text-gray-400 transition-all hover:rotate-90 hover:bg-brand-500/15 hover:text-brand-400"
                        >
                          <RotateCw size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc)}
                        aria-label={`Delete ${doc.name}`}
                        className="rounded-lg p-1.5 text-gray-500 opacity-0 transition-all hover:bg-rose-500/15 hover:text-rose-300 focus:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {isPending(doc) && <div className="progress-track progress-indeterminate h-[3px] rounded-none" aria-hidden="true" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
