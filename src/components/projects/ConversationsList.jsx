// src/components/projects/ConversationsList.jsx
import { Link } from "react-router-dom";
import { MessageSquare, Plus, Trash2 } from "lucide-react";

export default function ConversationsList({ project, chats, onCreateNewChat, onDeleteChat, isCreatingChat }) {
  return (
    <div className="flex-1 flex flex-col bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-700">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Project Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-medium text-gray-100 mb-1">{project.name}</h1>
              {project.description && <p className="text-gray-400">{project.description}</p>}
            </div>
            <button
              onClick={onCreateNewChat}
              disabled={isCreatingChat}
              className="bg-white hover:bg-gray-100 disabled:bg-gray-600 text-black px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm"
            >
              {isCreatingChat ? (
                "Creating..."
              ) : (
                <>
                  <Plus size={16} /> New conversation
                </>
              )}
            </button>
          </div>

          {/* Conversations Section */}
          <h2 className="text-sm font-medium text-gray-200 mb-4">Conversations</h2>
          {chats.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare size={24} className="text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-200">No conversations yet</h3>
              <p className="text-gray-400 mt-2">Start your first conversation to get insights.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {chats.map((chat) => (
                <li
                  key={chat._id}
                  className="group bg-[#202020] hover:bg-[#252525] border border-gray-800 rounded-lg transition-colors flex items-center justify-between"
                >
                  <Link
                    to={`/projects/${project._id}/chats/${chat._id}`}
                    className="flex-1 flex items-center gap-3 p-4"
                  >
                    <MessageSquare size={16} className="text-gray-400" />
                    <span className="font-medium text-gray-200">{chat.title}</span>
                  </Link>
                  <button
                    onClick={() => onDeleteChat(chat)}
                    aria-label={`Delete ${chat.title}`}
                    className="p-1.5 mr-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
