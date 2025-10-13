// src/pages/ProjectDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import apiClient from "../utils/apiClient";
import ConversationsList from "../components/projects/ConversationsList";
import KnowledgeBaseSidebar from "../components/projects/KnowledgeBaseSidebar";

export default function ProjectDetailPage() {
  const { projectId } = useParams(); // Get projectId from the URL
  const { getToken } = useAuth();

  const [project, setProject] = useState(null);
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        const headers = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch project details and chats in parallel
        const [projectRes, chatsRes] = await Promise.all([
          apiClient.get(`/projects/${projectId}`, headers), // Note: We need to build this endpoint
          apiClient.get(`/projects/${projectId}/chats`, headers)
        ]);

        setProject(projectRes.data);
        setChats(chatsRes.data);
      } catch (err) {
        setError("Failed to load project data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId, getToken]);

  const handleCreateNewChat = async () => {
    setIsCreatingChat(true);
    try {
      const token = await getToken();
      const title = `Conversation #${Math.floor(Math.random() * 1000)}`; // Simple title for now
      const res = await apiClient.post(`/projects/${projectId}/chats`, 
        { title }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChats([res.data, ...chats]); // Add new chat to the list
    } catch (err) {
      alert("Failed to create chat.");
    } finally {
      setIsCreatingChat(false);
    }
  };

  if (isLoading) return <div className="p-8 text-white">Loading project...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!project) return <div className="p-8 text-white">Project not found.</div>;

  return (
    <div className="flex h-full gap-4 p-4">
      <ConversationsList 
        project={project} 
        chats={chats}
        onCreateNewChat={handleCreateNewChat}
        isCreatingChat={isCreatingChat}
      />
      <KnowledgeBaseSidebar />
    </div>
  );
}