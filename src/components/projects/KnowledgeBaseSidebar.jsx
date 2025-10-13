import { FileText, Settings } from "lucide-react";
import { UploadDropzone } from "../../utils/uploadthing";
import { useAuth } from "@clerk/clerk-react";

export default function KnowledgeBaseSidebar() {
  const { getToken } = useAuth();

  const handleUploadComplete = (res) => {
    console.log("Files: ", res);
    alert("Upload Completed successfully!");
    // In a future step, we will add logic here to save file metadata to our DB
    // and then refetch the list of documents.
  };

  const handleUploadError = (error) => {
    alert(`ERROR! ${error.message}`);
    console.error("Upload Error:", error);
  };
  
  return (
    <div className="w-96 bg-[#1a1a1a] border border-gray-700 h-full flex flex-col rounded-xl">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-medium text-gray-100 flex items-center gap-2">
          <FileText size={18} className="text-blue-400" />
          Knowledge Base
        </h2>
      </div>
      
      <div className="flex border-b border-gray-700">
         <button className="flex-1 py-3 text-sm font-medium border-b-2 border-blue-400 text-blue-400 bg-blue-500/5">Documents</button>
         <button className="flex-1 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-300">Settings</button>
      </div>

      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-200 mb-4">Add Sources</h3>
        
        <UploadDropzone
  endpoint="documentUploader"
  onClientUploadComplete={handleUploadComplete}
  onUploadError={handleUploadError}
  headers={async () => {
    const token = await getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }}
  appearance={{
    container:
      "group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-700 bg-gradient-to-br from-[#1b1b1b] to-[#161616] p-8 transition-all duration-300 hover:from-[#1e1e1e] hover:to-[#1a1a1a] hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] cursor-pointer",
    label:
      "text-gray-300 text-sm font-medium mt-4 transition-colors duration-200 group-hover:text-blue-400",
    allowedContent:
      "text-gray-500 text-xs mt-2 group-hover:text-gray-400",
    uploadIcon:
      "w-14 h-14 text-gray-500 group-hover:text-blue-400 transition-transform duration-300 group-hover:scale-110",
    button:
      "mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-md transition-all duration-200 hover:shadow-[0_0_15px_rgba(59,130,246,0.35)] hover:scale-[1.03]",
  }}
/>

      </div>

      <div className="flex-1 p-6 border-t border-gray-800">
        <h3 className="text-sm font-medium text-gray-200 mb-4">Sources</h3>
         <div className="text-center py-12">
            <FileText size={24} className="text-gray-500 mx-auto mb-4" />
            <p className="text-sm text-gray-400">Your uploaded documents will appear here.</p>
        </div>
      </div>
    </div>
  );
}