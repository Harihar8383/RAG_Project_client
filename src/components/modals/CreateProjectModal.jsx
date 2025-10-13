import { useState } from "react";
import { X, Sparkles } from "lucide-react";

export default function CreateProjectModal({ isOpen, onClose, onCreateProject, isLoading }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateProject(name.trim(), description.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1a1a] border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Create new project</h2>
              <p className="text-sm text-gray-400">Start organizing your knowledge</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isLoading} className="p-2 text-gray-400 hover:text-gray-300 rounded-lg hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Project name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Research Analysis, Meeting Notes..."
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-white"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this project be about?"
              rows={3}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-white"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl font-medium text-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || isLoading} className="flex-1 px-4 py-3 bg-white hover:bg-gray-100 disabled:bg-gray-600 text-black rounded-xl font-medium flex items-center justify-center gap-2">
              {isLoading ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}