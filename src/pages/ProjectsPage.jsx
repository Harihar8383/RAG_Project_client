import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import apiClient from "../utils/apiClient";
import CreateProjectModal from "../components/modals/CreateProjectModal";
import { Plus, Folder, Search, LayoutGrid, List, Trash2, ArrowUpRight, Sparkles } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton";
import { useToast } from "../components/ui/toast-context";
import { useConfirm } from "../components/ui/confirm-context";
import { spotlightMove } from "../components/ui/spotlight";

// Each project gets one of these colours, chosen from its name so that it stays the same between visits.
const ACCENTS = [
  "from-brand-500 to-violet-500",
  "from-cyan-500 to-brand-500",
  "from-emerald-500 to-cyan-500",
  "from-fuchsia-500 to-violet-500",
  "from-amber-400 to-rose-500",
];
const accentFor = (name) => ACCENTS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % ACCENTS.length];

function ProjectsSkeleton({ view }) {
  const layout = view === "grid" ? "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-3";
  return (
    <div className={layout} aria-label="Loading projects" role="status">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="glass rounded-2xl p-6" style={{ opacity: 1 - i * 0.12 }}>
          <Skeleton className="mb-5 h-12 w-12 rounded-2xl" />
          <Skeleton className="mb-3 h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="anim-fade-up py-20 text-center">
      <div className="anim-float relative mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500/30 to-violet-500/20 ring-1 ring-white/10">
        <div className="pulse-ring absolute inset-0 rounded-3xl" />
        <Sparkles size={34} className="text-brand-400" />
      </div>
      <h3 className="mb-3 text-2xl font-semibold text-white">Create your first project</h3>
      <p className="mx-auto max-w-sm text-gray-400">Projects help you organize your documents and conversations.</p>
      <button onClick={onCreate} className="btn-primary mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm">
        <Plus size={16} /> Start a project
      </button>
    </div>
  );
}

function ProjectsList({ projects, view, onDelete }) {
  const grid = view === "grid";
  const layout = grid ? "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-3";

  return (
    <ul className={`stagger ${layout}`}>
      {projects.map((project, i) => (
        <li
          key={project._id}
          style={{ "--i": Math.min(i, 12) }}
          onMouseMove={spotlightMove}
          className="group glass card-lift spotlight relative rounded-2xl"
        >
          <Link to={`/projects/${project._id}`} className={`flex ${grid ? "flex-col p-6" : "items-center gap-5 p-4 pr-14"}`}>
            <div
              className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${accentFor(project.name)} ${
                grid ? "mb-5 h-12 w-12" : "h-11 w-11"
              }`}
            >
              <Folder size={22} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-base font-semibold text-white">{project.name}</h3>
              {project.description && <p className="mt-1.5 line-clamp-2 text-sm text-gray-400">{project.description}</p>}
              {project.createdAt && (
                <p className="mt-3 text-xs text-gray-500">Created {new Date(project.createdAt).toLocaleDateString()}</p>
              )}
            </div>
            <ArrowUpRight
              size={18}
              className="absolute right-4 top-4 text-gray-500 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-400 group-hover:opacity-100"
              style={grid ? undefined : { top: "1.1rem" }}
            />
          </Link>
          <button
            onClick={() => onDelete(project)}
            aria-label={`Delete ${project.name}`}
            className="absolute bottom-3 right-3 rounded-lg p-1.5 text-gray-500 opacity-0 transition-all hover:bg-rose-500/15 hover:text-rose-300 focus:opacity-100 group-hover:opacity-100"
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
  const toast = useToast();
  const confirm = useConfirm();

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
      toast.success(`Project "${name}" created.`);
    } catch (err) {
      toast.error("Failed to create project.");
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (project) => {
    const ok = await confirm({
      title: `Delete "${project.name}"?`,
      message: "Its documents, indexed content and all its conversations are removed. This cannot be undone.",
      confirmText: "Delete project",
    });
    if (!ok) return;
    try {
      const token = await getToken();
      await apiClient.delete(`/projects/${project._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects((prev) => prev.filter((p) => p._id !== project._id));
      toast.success("Project deleted.");
    } catch {
      toast.error("Failed to delete the project.");
    }
  };

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? projects.filter(
        (p) => p.name.toLowerCase().includes(needle) || (p.description || "").toLowerCase().includes(needle)
      )
    : projects;

  const toggle = (active) =>
    `rounded-lg p-2 transition-all duration-200 ${
      active ? "bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-md" : "text-gray-400 hover:text-white"
    }`;

  return (
    <>
      <div className="p-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-gradient text-3xl font-extrabold tracking-tight">Projects</h1>
            <p className="mt-1.5 text-sm text-gray-400">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm"
          >
            <Plus size={16} />
            Create new
          </button>
        </div>

        <div className="mb-7 flex items-center gap-3">
          <div className="group relative max-w-md flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-brand-400" />
            <input
              type="search"
              aria-label="Search projects"
              placeholder="Search projects"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-glow w-full rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-gray-500"
            />
          </div>
          <div className="glass flex gap-1 rounded-xl p-1">
            <button onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={toggle(view === "grid")}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={toggle(view === "list")}>
              <List size={16} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <ProjectsSkeleton view={view} />
        ) : error ? (
          <p className="text-rose-300">{error}</p>
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => setIsModalOpen(true)} />
        ) : visible.length === 0 ? (
          <p className="anim-fade-in text-gray-400">No projects match your search.</p>
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
