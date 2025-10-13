// src/components/projects/KnowledgeBaseSidebar.jsx
import { FileText } from "lucide-react";

export default function KnowledgeBaseSidebar() {
  return (
    <div className="w-80 bg-[#1a1a1a] border border-gray-700 h-full flex flex-col rounded-xl">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-medium text-gray-100 flex items-center gap-2">
          <FileText size={18} className="text-blue-400" />
          Knowledge Base
        </h2>
      </div>
      <div className="flex-1 p-4">
        <p className="text-sm text-gray-400">Document uploads and settings will appear here.</p>
      </div>
    </div>
  );
}