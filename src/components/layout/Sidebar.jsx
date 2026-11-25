import { UserButton } from "@clerk/clerk-react";
import { Plus, Briefcase, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../ui/Logo";

export default function Sidebar({ onNewProjectClick }) {
  // Starts collapsed on phones, so the page keeps room for its content.
  const [isCollapsed, setIsCollapsed] = useState(() => window.matchMedia?.("(max-width: 767px)").matches === true);
  const location = useLocation();
  const onProjects = location.pathname.startsWith("/projects");

  return (
    <div
      className={`glass relative z-20 flex flex-col text-white transition-[width] duration-300 ease-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
      style={{ borderTop: 0, borderBottom: 0, borderLeft: 0 }}
    >
      <div className="flex items-center justify-between p-4">
        {isCollapsed ? <Logo showText={false} size={32} className="anim-pop" /> : <Logo className="anim-fade-in" />}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`rounded-lg p-2 transition-colors hover:bg-white/10 ${isCollapsed ? "absolute -right-3 top-5 border border-white/10 bg-ink-800" : ""}`}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={16} className="text-gray-300" />
          ) : (
            <PanelLeftClose size={20} className="text-gray-400" />
          )}
        </button>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={onNewProjectClick}
          className={`btn-primary flex w-full items-center gap-3 rounded-xl text-sm ${
            isCollapsed ? "justify-center p-3" : "p-3"
          }`}
        >
          <Plus size={16} />
          {!isCollapsed && <span>New project</span>}
        </button>
      </div>

      <div className="px-4 pb-4">
        <nav className="space-y-1">
          <Link
            to="/projects"
            className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-3 text-sm transition-colors ${
              onProjects ? "bg-white/[0.08] text-white" : "text-gray-400 hover:bg-white/[0.06] hover:text-gray-100"
            } ${isCollapsed ? "justify-center" : ""}`}
          >
            <span
              className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-400 to-accent-400 transition-opacity ${
                onProjects ? "opacity-100" : "opacity-0"
              }`}
            />
            <Briefcase size={16} className="transition-transform duration-300 group-hover:scale-110" />
            {!isCollapsed && <span>Projects</span>}
          </Link>
        </nav>
      </div>

      <div className="flex-1" />

      <div className="border-t border-white/[0.06] p-4">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <UserButton afterSignOutUrl="/" />
          {!isCollapsed && <span className="text-sm text-gray-400">Profile</span>}
        </div>
      </div>
    </div>
  );
}
