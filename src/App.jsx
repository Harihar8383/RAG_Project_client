import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from "@clerk/clerk-react";
import HomePage from './pages/HomePage';
import RootLayout from './Layouts/RootLayout';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';

function App() {
  const { userId, isLoaded } = useAuth();

  // While Clerk checks the session, render a loading screen so that no page
  // (such as the home page with its sign-in button) renders prematurely.
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* A signed-in user who opens '/' goes straight to their projects. */}
      <Route
        path="/"
        element={userId ? <Navigate to="/projects" /> : <HomePage />}
      />

      {/* Protected routes live inside RootLayout, which redirects signed-out users. */}
      <Route element={<RootLayout />}>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/projects/:projectId/chats/:chatId" element={<ProjectDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;
