import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import apiClient from "../utils/apiClient";
import CreateProjectModal from "../components/modals/CreateProjectModal";
import { Plus, Folder } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";

// A simple component to display the list of projects
function ProjectsList({ projects }) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gray-800 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <Plus size={32} className="text-gray-400" />
        </div>
        <h3 className="text-2xl font-medium text-white mb-3">Create your first project</h3>
        <p className="text-gray-400">
          Projects help you organize your documents and conversations.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.map((project) => (
        <Link to={`/projects/${project._id}`} key={project._id}>
        <div key={project._id} className="group bg-gray-900/50 hover:bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-6 cursor-pointer">
          <div className="w-12 h-12 bg-gray-700 rounded-xl mb-4 flex items-center justify-center">
            <Folder size={24} className="text-gray-400" />
          </div>
          <h3 className="font-medium text-white text-base line-clamp-2">{project.name}</h3>
          {project.description && (
            <p className="text-gray-400 text-sm line-clamp-2 mt-2">{project.description}</p>
          )}
        </div>
        </Link>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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
      const res = await apiClient.post("/projects", 
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects([res.data, ...projects]); // Add new project to the top of the list
      setIsModalOpen(false); // Close modal on success
    } catch (err) {
      alert("Failed to create project.");
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="p-8">
        {/* Header */}
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

        {/* Content */}
        {isLoading ? (
          <p className="text-gray-400">Loading projects...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <ProjectsList projects={projects} />
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