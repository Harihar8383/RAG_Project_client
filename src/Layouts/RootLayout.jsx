// src/layouts/RootLayout.jsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";

export default function RootLayout() {
  const { userId, isLoaded } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  if (!isLoaded) return <div>Loading...</div>;
  if (!userId) return <Navigate to="/" />;

  // Moving between the projects list and one project fades the page in again. Moving between the
  // conversation list and a chat inside one project keeps the same key, so the project is not reloaded.
  const pageKey = location.pathname.split("/").slice(0, 3).join("/");

  return (
    <div className="relative flex h-screen">
      <Sidebar onNewProjectClick={() => setIsModalOpen(true)} />
      <main className="relative z-10 flex flex-1 flex-col overflow-y-auto">
        <div key={pageKey} className="anim-fade-up flex min-h-0 flex-1 flex-col">
          <Outlet context={{ isModalOpen, setIsModalOpen }} />
        </div>
      </main>
    </div>
  );
}
