import { UserButton } from "@clerk/clerk-react";
import { Plus, Briefcase, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ onNewProjectClick }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div
      className={`bg-[#1a1a1a] text-white flex flex-col transition-all duration-300 border-r border-gray-700 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="bg-gradient-to-r from-cyan-500 to-blue-400 bg-clip-text text-transparent text-2xl font-extrabold font-sans">
  Verix
</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-[#252525] rounded-md transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen size={20} className="text-gray-400" />
          ) : (
            <PanelLeftClose size={20} className="text-gray-400" />
          )}
        </button>
      </div>

      {/* New Project Button */}
      <div className="px-4 pb-4">
        <button onClick={onNewProjectClick}
          className={`w-full bg-[#252525] hover:bg-[#2a2a2a] border border-gray-700 hover:border-gray-600 rounded-lg transition-colors flex items-center gap-3 ${
            isCollapsed ? "p-3 justify-center" : "p-3"
          }`}
        >
          <Plus size={16} className="text-gray-400" />
          {!isCollapsed && <span className="text-gray-200">New project</span>}
        </button>
      </div>

      {/* Navigation */}
      <div className="px-4 pb-4">
        <nav className="space-y-1">
          <Link
            to="/projects"
            className={`w-full flex items-center gap-3 p-3 text-sm rounded-md transition-colors ${
              location.pathname.startsWith("/projects")
                ? "bg-[#252525] text-gray-200"
                : "text-gray-400 hover:bg-[#252525] hover:text-gray-200"
            } ${isCollapsed ? "justify-center" : ""}`}
          >
            <Briefcase size={16} />
            {!isCollapsed && <span>Projects</span>}
          </Link>
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <UserButton afterSignOutUrl="/" />
          {!isCollapsed && <span className="text-sm text-gray-400">Profile</span>}
        </div>
      </div>
    </div>
  );
}