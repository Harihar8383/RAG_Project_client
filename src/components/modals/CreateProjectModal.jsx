import { useEffect, useState } from "react";
import { X, FolderPlus, Loader2 } from "lucide-react";

const NAME_LIMIT = 60;
const DESCRIPTION_LIMIT = 200;

function ProjectForm({ onClose, onCreateProject, isLoading }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Escape closes the popup, unless a project is being created.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLoading, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateProject(name.trim(), description.trim());
    }
  };

  const counter = (value, limit) => (
    <span className={`text-xs tabular-nums ${value.length > limit * 0.9 ? "text-amber-300" : "text-gray-500"}`}>
      {value.length}/{limit}
    </span>
  );

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="anim-scale-in clay relative w-full max-w-md overflow-hidden rounded-3xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="relative flex items-center justify-between border-b border-white/[0.07] p-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl icon-tile">
              <FolderPlus size={20} />
            </div>
            <div>
              <h2 id="create-project-title" className="text-lg font-semibold text-white">Create new project</h2>
              <p className="text-sm text-gray-400">Start organizing your knowledge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close"
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-6 p-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">Project name</label>
              {counter(name, NAME_LIMIT)}
            </div>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, NAME_LIMIT))}
              placeholder="e.g., Research Analysis, Meeting Notes..."
              disabled={isLoading}
              className="input-glow w-full rounded-xl px-4 py-3 text-white placeholder:text-gray-600"
              required
              autoFocus
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description (optional)</label>
              {counter(description, DESCRIPTION_LIMIT)}
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_LIMIT))}
              placeholder="What will this project be about?"
              rows={3}
              disabled={isLoading}
              className="input-glow w-full resize-none rounded-xl px-4 py-3 text-white placeholder:text-gray-600"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-ghost flex-1 rounded-xl px-4 py-3 font-medium text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating...
                </>
              ) : (
                "Create project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// The form is created each time the popup opens, so it never shows the text of an earlier project.
export default function CreateProjectModal({ isOpen, ...rest }) {
  if (!isOpen) return null;
  return <ProjectForm {...rest} />;
}
