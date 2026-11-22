// src/pages/ProjectDetailPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import apiClient from "../utils/apiClient";
import ConversationsList from "../components/projects/ConversationsList";
import KnowledgeBaseSidebar from "../components/projects/KnowledgeBaseSidebar";
import ChatInterface from "../components/chat/ChatInterface";

export default function ProjectDetailPage() {
  const { projectId, chatId } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();

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

        const [projectRes, chatsRes] = await Promise.all([
          apiClient.get(`/projects/${projectId}`, headers),
          apiClient.get(`/projects/${projectId}/chats`, headers),
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
      const title = `Conversation ${chats.length + 1}`;
      const res = await apiClient.post(
        `/projects/${projectId}/chats`,
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChats((prev) => [res.data, ...prev]);
      navigate(`/projects/${projectId}/chats/${res.data._id}`);
    } catch {
      alert("Failed to create chat.");
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteChat = async (chat) => {
    if (!window.confirm(`Delete "${chat.title}" and its messages?`)) return;
    try {
      const token = await getToken();
      await apiClient.delete(`/projects/${projectId}/chats/${chat._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats((prev) => prev.filter((c) => c._id !== chat._id));
      if (chatId === chat._id) navigate(`/projects/${projectId}`);
    } catch {
      alert("Failed to delete the conversation.");
    }
  };

  if (isLoading) return <div className="p-8 text-white">Loading project...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!project) return <div className="p-8 text-white">Project not found.</div>;

  return (
    <div className="flex h-full gap-4 p-4">
      {chatId ? (
        <ChatInterface key={chatId} />
      ) : (
        <ConversationsList
          project={project}
          chats={chats}
          onCreateNewChat={handleCreateNewChat}
          onDeleteChat={handleDeleteChat}
          isCreatingChat={isCreatingChat}
        />
      )}
      <KnowledgeBaseSidebar />
    </div>
  );
}
