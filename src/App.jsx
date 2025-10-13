import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from "@clerk/clerk-react";
import HomePage from './pages/HomePage';
import RootLayout from './Layouts/RootLayout';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage'; 

function App() {
  const { userId, isLoaded } = useAuth();

  // The most important part:
  // While Clerk is checking the user's session, we render a loading screen.
  // This prevents any other components (like HomePage with its SignInButton)
  // from rendering prematurely.
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/*
        If the user is logged in, any attempt to visit the homepage '/'
        will automatically redirect them to their '/projects' dashboard.
      */}
      <Route 
        path="/" 
        element={userId ? <Navigate to="/projects" /> : <HomePage />} 
      />

      {/* All protected routes are nested inside the RootLayout.
        The RootLayout itself will handle redirecting unauthenticated users.
      */}
      <Route element={<RootLayout />}>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;