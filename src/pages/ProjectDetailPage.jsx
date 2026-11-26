// src/pages/ProjectDetailPage.jsx
import { useEffect, useState } from "react";
import { useMatch, useNavigate, useParams } from "react-router-dom";
import ExamMap from "../components/projects/ExamMap";
import { useAuth } from "@clerk/clerk-react";
import apiClient from "../utils/apiClient";
import ConversationsList from "../components/projects/ConversationsList";
import KnowledgeBaseSidebar from "../components/projects/KnowledgeBaseSidebar";
import ChatInterface from "../components/chat/ChatInterface";
import Skeleton from "../components/ui/Skeleton";
import { useToast } from "../components/ui/toast-context";
import { useConfirm } from "../components/ui/confirm-context";

export default function ProjectDetailPage() {
  const { projectId, chatId } = useParams();
  const examMapOpen = Boolean(useMatch("/projects/:projectId/exam-map"));
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [project, setProject] = useState(null);
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [showFiles, setShowFiles] = useState(false); // small screens only: the knowledge base opens over the chat

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
      toast.error("Failed to create chat.");
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Mirrors the server, which names a new chat after its first question.
  const handleFirstQuestion = (question) =>
    setChats((prev) =>
      prev.map((c) => (c._id === chatId && /^Conversation \d+$/.test(c.title) ? { ...c, title: question.slice(0, 60) } : c))
    );

  const handleDeleteChat = async (chat) => {
    const ok = await confirm({
      title: `Delete "${chat.title}"?`,
      message: "All the messages in this conversation are removed.",
      confirmText: "Delete conversation",
    });
    if (!ok) return;
    try {
      const token = await getToken();
      await apiClient.delete(`/projects/${projectId}/chats/${chat._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats((prev) => prev.filter((c) => c._id !== chat._id));
      toast.success("Conversation deleted.");
      if (chatId === chat._id) navigate(`/projects/${projectId}`);
    } catch {
      toast.error("Failed to delete the conversation.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full gap-4 p-4" role="status" aria-label="Loading project">
        <div className="clay flex-1 rounded-2xl p-8">
          <Skeleton className="mb-3 h-8 w-1/3" />
          <Skeleton className="mb-10 h-4 w-1/2" />
          <Skeleton className="mb-3 h-16 w-full" />
          <Skeleton className="mb-3 h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="clay hidden w-96 rounded-2xl p-6 lg:block">
          <Skeleton className="mb-6 h-6 w-1/2" />
          <Skeleton className="h-44 w-full" />
        </div>
      </div>
    );
  }
  if (error) return <div className="p-8 text-rose-300">{error}</div>;
  if (!project) return <div className="p-8 text-white">Project not found.</div>;

  return (
    <div className="flex h-full gap-4 p-4">
      {chatId ? (
        <ChatInterface key={chatId} onFirstQuestion={handleFirstQuestion} />
      ) : examMapOpen ? (
        <ExamMap />
      ) : (
        <ConversationsList
          project={project}
          chats={chats}
          onCreateNewChat={handleCreateNewChat}
          onDeleteChat={handleDeleteChat}
          isCreatingChat={isCreatingChat}
        />
      )}
      <div
        className={`${showFiles ? "fixed inset-0 z-40 flex justify-end bg-black/60 p-4" : "hidden"} lg:static lg:z-auto lg:flex lg:shrink-0 lg:bg-transparent lg:p-0`}
        onClick={(e) => e.target === e.currentTarget && setShowFiles(false)}
      >
        <KnowledgeBaseSidebar />
      </div>
      <button
        onClick={() => setShowFiles((open) => !open)}
        aria-expanded={showFiles}
        aria-label={showFiles ? "Close the knowledge base" : "Open the knowledge base"}
        className="btn-primary fixed bottom-32 right-5 z-50 rounded-xl px-4 py-2.5 text-sm lg:hidden" // above the chat's Send button
      >
        {showFiles ? "Close" : "Files"}
      </button>
    </div>
  );
}
