// src/components/projects/ConversationsList.jsx
import { Link } from "react-router-dom";
import { MessageSquare, Plus, Trash2, ArrowRight, Loader2, Folder } from "lucide-react";
import { timeAgo } from "../../utils/timeAgo";
import { spotlightMove } from "../ui/spotlight";

export default function ConversationsList({ project, chats, onCreateNewChat, onDeleteChat, isCreatingChat }) {
  return (
    <div className="glass flex flex-1 flex-col overflow-hidden rounded-2xl">
      <div className="flex-1 overflow-y-auto p-7">
        <div className="mx-auto max-w-4xl">
          <div className="mb-9 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 shadow-lg">
                <Folder size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-gradient text-3xl font-extrabold tracking-tight">{project.name}</h1>
                {project.description && <p className="mt-1.5 max-w-xl text-gray-400">{project.description}</p>}
              </div>
            </div>
            <button
              onClick={onCreateNewChat}
              disabled={isCreatingChat}
              className="btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm"
            >
              {isCreatingChat ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Plus size={16} /> New conversation
                </>
              )}
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Conversations</h2>
            <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-xs text-gray-400">{chats.length}</span>
          </div>

          {chats.length === 0 ? (
            <div className="anim-fade-up py-16 text-center">
              <div className="anim-float mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] ring-1 ring-white/10">
                <MessageSquare size={26} className="text-brand-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-100">No conversations yet</h3>
              <p className="mt-2 text-gray-400">Start your first conversation to get insights.</p>
            </div>
          ) : (
            <ul className="stagger space-y-3">
              {chats.map((chat, i) => (
                <li
                  key={chat._id}
                  style={{ "--i": Math.min(i, 12) }}
                  onMouseMove={spotlightMove}
                  className="group spotlight card-lift flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03]"
                >
                  <Link to={`/projects/${project._id}/chats/${chat._id}`} className="flex flex-1 items-center gap-4 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-violet-500/20 text-brand-400 transition-transform duration-300 group-hover:scale-110">
                      <MessageSquare size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-gray-100">{chat.title}</span>
                      {chat.createdAt && <span className="block text-xs text-gray-500">Started {timeAgo(chat.createdAt)}</span>}
                    </span>
                    <ArrowRight size={16} className="text-gray-600 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-400" />
                  </Link>
                  <button
                    onClick={() => onDeleteChat(chat)}
                    aria-label={`Delete ${chat.title}`}
                    className="mr-3 rounded-lg p-1.5 text-gray-500 opacity-0 transition-all hover:bg-rose-500/15 hover:text-rose-300 focus:opacity-100 group-hover:opacity-100"
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
