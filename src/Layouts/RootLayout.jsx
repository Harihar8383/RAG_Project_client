// src/layouts/RootLayout.jsx
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";

export default function RootLayout() {
  const { userId, isLoaded } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isLoaded) return <div>Loading...</div>;
  if (!userId) return <Navigate to="/" />;

  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      <Sidebar onNewProjectClick={() => setIsModalOpen(true)} />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Outlet context={{ isModalOpen, setIsModalOpen }} />
      </main>
    </div>
  );
}