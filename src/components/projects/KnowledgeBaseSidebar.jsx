import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import { UploadDropzone } from "../../utils/uploadthing";
import apiClient from "../../utils/apiClient";

const POLL_INTERVAL_MS = 3000;

const STATUS_LABELS = {
  uploaded: { text: "Queued", className: "text-gray-300 bg-gray-700/40" },
  processing: { text: "Processing", className: "text-blue-300 bg-blue-500/10" },
  indexed: { text: "Ready", className: "text-green-300 bg-green-500/10" },
  failed: { text: "Failed", className: "text-red-300 bg-red-500/10" },
};

const getFileIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  if (extension === "pdf") return <FileText size={16} className="text-red-400" />;
  if (["doc", "docx"].includes(extension)) return <File size={16} className="text-blue-400" />;
  if (["xls", "xlsx", "csv"].includes(extension))
    return <FileSpreadsheet size={16} className="text-green-400" />;
  return <File size={16} className="text-gray-400" />;
};

const isPending = (doc) => doc.status === "uploaded" || doc.status === "processing";

export default function KnowledgeBaseSidebar() {
  const { getToken } = useAuth();
  const { projectId } = useParams();

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle | uploading | processing | done
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get(`/projects/${projectId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, projectId]);

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

  const handleUploadComplete = () => {
    setUploadStatus("processing");
    setUploadProgress(100);
    setTimeout(() => {
      setUploadStatus("done");
      fetchDocuments();
      setTimeout(() => setUploadStatus("idle"), 1500);
    }, 1000);
  };

  const handleUploadError = (err) => {
    setError(`Upload failed. ${err.message}`);
    setUploadStatus("idle");
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.name}"? Its indexed content is removed too.`)) return;
    setError(null);
    try {
      const token = await getToken();
      await apiClient.delete(`/projects/${projectId}/documents/${doc._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments((prev) => prev.filter((d) => d._id !== doc._id));
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
    } catch {
      setError(`Could not retry ${doc.name}. Try again.`);
    }
  };

  return (
    <div className="w-96 bg-[#1a1a1a] border border-gray-700 h-full flex flex-col rounded-xl shadow-lg">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-medium text-gray-100 flex items-center gap-2">
          <FileText size={18} className="text-blue-400" />
          Knowledge Base
        </h2>
      </div>

      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-200 mb-4">Add Sources</h3>

        <div className="relative group transition-all">
          {uploadStatus === "uploading" && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
              <Loader2 className="text-blue-400 animate-spin mb-2" size={28} />
              <p className="text-blue-300 text-sm font-medium">Uploading...</p>
              <div className="w-2/3 bg-gray-700 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-blue-500 h-2 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}

          {uploadStatus === "processing" && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
              <Loader2 className="text-green-400 animate-spin mb-2" size={28} />
              <p className="text-green-300 text-sm font-medium">Processing file...</p>
            </div>
          )}

          {uploadStatus === "done" && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
              <CheckCircle2 className="text-green-400 mb-2" size={28} />
              <p className="text-green-300 text-sm font-medium">Upload Complete!</p>
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
            appearance={{
              container:
                "border-2 border-dashed border-gray-700 bg-gradient-to-b from-[#202020] to-[#181818] hover:from-[#232323] hover:to-[#1c1c1c] transition-all duration-300 p-6 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer",
              label: "text-gray-300 text-sm font-medium mt-2",
              allowedContent: "text-gray-500 text-xs mt-1",
              uploadIcon: "text-blue-400 w-14 h-14 mb-2 group-hover:scale-110 transition-transform duration-300",
              button:
                "bg-blue-600 text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-300 mt-3",
            }}
          />
        </div>
      </div>

      <div className="flex-1 p-6 border-t border-gray-800 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-200">Sources</h3>
          <span className="text-xs text-gray-400 bg-[#252525] px-2 py-1 rounded">{documents.length}</span>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-400 mb-3">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-400">Loading documents...</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={24} className="text-gray-500 mx-auto mb-4" />
            <p className="text-sm text-gray-400">No documents uploaded yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => {
              const badge = STATUS_LABELS[doc.status] || STATUS_LABELS.uploaded;
              return (
                <li
                  key={doc._id}
                  className="group flex items-center gap-3 bg-[#202020] hover:bg-[#252525] p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex-shrink-0">{getFileIcon(doc.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span data-testid={`status-${doc._id}`} className={`px-1.5 rounded ${badge.className}`}>
                        {badge.text}
                      </span>
                    </p>
                    {doc.status === "failed" && doc.failureReason && (
                      <p className="text-xs text-red-400 mt-1">{doc.failureReason}</p>
                    )}
                  </div>
                  {doc.status === "failed" && (
                    <button
                      onClick={() => handleRetry(doc)}
                      aria-label={`Retry ${doc.name}`}
                      className="p-1.5 text-gray-400 hover:text-blue-300"
                    >
                      <RotateCw size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(doc)}
                    aria-label={`Delete ${doc.name}`}
                    className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
