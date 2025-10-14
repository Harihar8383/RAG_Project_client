import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  FileText,
  Settings,
  File,
  FileSpreadsheet,
  Globe,
  Trash2,
  UploadCloud,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { UploadDropzone } from "../../utils/uploadthing";
import apiClient from "../../utils/apiClient";

// --- Helper Functions for UI ---
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getFileIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  if (extension === "pdf") return <FileText size={16} className="text-red-400" />;
  if (["doc", "docx"].includes(extension))
    return <File size={16} className="text-blue-400" />;
  if (["xls", "xlsx", "csv"].includes(extension))
    return <FileSpreadsheet size={16} className="text-green-400" />;
  return <File size={16} className="text-gray-400" />;
};

// --- Main Component ---
export default function KnowledgeBaseSidebar() {
  const { getToken } = useAuth();
  const { projectId } = useParams();

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState("idle"); // "idle" | "uploading" | "processing" | "done"
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchDocuments = async () => {
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
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId, getToken]);

  const handleUploadComplete = (res) => {
    console.log("Files uploaded: ", res);
    setUploadStatus("processing");
    setUploadProgress(100);

    setTimeout(() => {
      setUploadStatus("done");
      fetchDocuments();
      setTimeout(() => setUploadStatus("idle"), 1500);
    }, 1000);
  };

  const handleUploadError = (error) => {
    alert(`ERROR! ${error.message}`);
    console.error("Upload Error:", error);
    setUploadStatus("idle");
  };

  return (
    <div className="w-96 bg-[#1a1a1a] border border-gray-700 h-full flex flex-col rounded-xl shadow-lg">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-medium text-gray-100 flex items-center gap-2">
          <FileText size={18} className="text-blue-400" />
          Knowledge Base
        </h2>
      </div>

      <div className="flex border-b border-gray-700">
        <button className="flex-1 py-3 text-sm font-medium border-b-2 border-blue-400 text-blue-400 bg-blue-500/5">
          Documents
        </button>
        <button className="flex-1 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-300">
          Settings
        </button>
      </div>

      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-200 mb-4">Add Sources</h3>

        {/* --- Enhanced Dropzone Wrapper --- */}
        <div className="relative group transition-all">
          {uploadStatus === "uploading" && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
              <Loader2 className="text-blue-400 animate-spin mb-2" size={28} />
              <p className="text-blue-300 text-sm font-medium">Uploading...</p>
              <div className="w-2/3 bg-gray-700 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
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
            onClientUploadComplete={(res) => handleUploadComplete(res)}
            onUploadError={(err) => handleUploadError(err)}
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
              uploadIcon:
                "text-blue-400 w-14 h-14 mb-2 group-hover:scale-110 transition-transform duration-300",
              button:
                "bg-blue-600 text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-300 mt-3",
            }}
          />
        </div>
      </div>

      <div className="flex-1 p-6 border-t border-gray-800 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-200">Sources</h3>
          <span className="text-xs text-gray-400 bg-[#252525] px-2 py-1 rounded">
            {documents.length}
          </span>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400">Loading documents...</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={24} className="text-gray-500 mx-auto mb-4" />
            <p className="text-sm text-gray-400">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="group flex items-center gap-3 bg-[#202020] hover:bg-[#252525] p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex-shrink-0">{getFileIcon(doc.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
