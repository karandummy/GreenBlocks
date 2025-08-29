import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Home from './pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProjectDeveloperDashboard from './components/dashboard/ProjectDeveloperDashboard';
import CreditBuyerDashboard from './components/dashboard/CreditBuyerDashboard';
import RegulatoryDashboard from './components/dashboard/RegulatoryDashboard';
import NotFound from './pages/NotFound';

// Hooks
import { useAuth } from './hooks/useAuth';

import './App.css';
console.log({
  Header,
  Footer,
  LoadingSpinner,
  CreditBuyerDashboard,
  RegulatoryDashboard,
  NotFound
});


// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// Dashboard Router Component
function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'project_developer':
      return <ProjectDeveloperDashboard />;
    case 'credit_buyer':
      return <CreditBuyerDashboard />;
    case 'regulatory_body':
      return <RegulatoryDashboard />;
    default:
      return <Navigate to="/login" />;
  }
}


function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Router>
          <div className="App min-h-screen bg-gray-50">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  theme: {
                    primary: '#4aed88',
                  },
                },
              }}
            />
            
            <Header />
            
            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardRouter />
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="/unauthorized" element={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-red-600 mb-4">Unauthorized</h1>
                      <p className="text-gray-600">You don't have permission to access this page.</p>
                    </div>
                  </div>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            
            <Footer />
          </div>
        </Router>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;