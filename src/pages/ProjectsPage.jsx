import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import apiClient from "../utils/apiClient";
import CreateProjectModal from "../components/modals/CreateProjectModal";
import { Plus, Folder, Search, LayoutGrid, List, Trash2 } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";

function ProjectsList({ projects, view, onDelete }) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gray-800 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <Plus size={32} className="text-gray-400" />
        </div>
        <h3 className="text-2xl font-medium text-white mb-3">Create your first project</h3>
        <p className="text-gray-400">Projects help you organize your documents and conversations.</p>
      </div>
    );
  }

  const layout =
    view === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      : "flex flex-col gap-2";

  return (
    <ul className={layout}>
      {projects.map((project) => (
        <li
          key={project._id}
          className="group relative bg-gray-900/50 hover:bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl"
        >
          <Link to={`/projects/${project._id}`} className="block p-6">
            <div className="w-12 h-12 bg-gray-700 rounded-xl mb-4 flex items-center justify-center">
              <Folder size={24} className="text-gray-400" />
            </div>
            <h3 className="font-medium text-white text-base line-clamp-2">{project.name}</h3>
            {project.description && (
              <p className="text-gray-400 text-sm line-clamp-2 mt-2">{project.description}</p>
            )}
            {project.createdAt && (
              <p className="text-gray-500 text-xs mt-3">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </p>
            )}
          </Link>
          <button
            onClick={() => onDelete(project)}
            aria-label={`Delete ${project.name}`}
            className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const { isModalOpen, setIsModalOpen } = useOutletContext();
  const [isCreating, setIsCreating] = useState(false);

  const { getToken } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = await getToken();
        const res = await apiClient.get("/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(res.data);
      } catch (err) {
        setError("Failed to fetch projects.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [getToken]);

  const handleCreateProject = async (name, description) => {
    setIsCreating(true);
    try {
      const token = await getToken();
      const res = await apiClient.post(
        "/projects",
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects((prev) => [res.data, ...prev]);
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to create project.");
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.name}", its documents and all its conversations?`)) return;
    try {
      const token = await getToken();
      await apiClient.delete(`/projects/${project._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects((prev) => prev.filter((p) => p._id !== project._id));
    } catch {
      alert("Failed to delete the project.");
    }
  };

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? projects.filter(
        (p) => p.name.toLowerCase().includes(needle) || (p.description || "").toLowerCase().includes(needle)
      )
    : projects;

  return (
    <>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium text-white">Projects</h1>
            <p className="text-gray-400 text-sm mt-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-full flex items-center gap-2 font-medium text-sm"
          >
            <Plus size={16} />
            Create new
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              aria-label="Search projects"
              placeholder="Search projects"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div className="flex border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              className={`p-2 ${view === "grid" ? "bg-gray-700 text-white" : "text-gray-400"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={`p-2 ${view === "list" ? "bg-gray-700 text-white" : "text-gray-400"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-400">Loading projects...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : visible.length === 0 && projects.length > 0 ? (
          <p className="text-gray-400">No projects match your search.</p>
        ) : (
          <ProjectsList projects={visible} view={view} onDelete={handleDeleteProject} />
        )}
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateProject={handleCreateProject}
        isLoading={isCreating}
      />
    </>
  );
}
