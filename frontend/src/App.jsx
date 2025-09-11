import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { BlockchainProvider } from './context/BlockchainContext';

// Common Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Dashboard Components
import ProjectDeveloperDashboard from './components/dashboard/ProjectDeveloperDashboard';
import CreditBuyerDashboard from './components/dashboard/CreditBuyerDashboard';
import RegulatoryDashboard from './components/dashboard/RegulatoryDashboard';

// Project Components
import ProjectRegistration from './components/projects/ProjectRegistration';
import ProjectList from './components/projects/ProjectList';
import ProjectDetails from './components/projects/ProjectDetails';
import MRVDataSubmission from './components/projects/MRVDataSubmission';

// Credit Components
import CreditClaim from './components/credits/CreditClaim';
import CreditMarketplace from './components/credits/CreditMarketplace';
import CreditVerification from './components/credits/CreditVerification';
import CreditHistory from './components/credits/CreditHistory';

// Blockchain Components
import TransactionHistory from './components/blockchain/TransactionHistory';
import BlockchainExplorer from './components/blockchain/BlockchainExplorer';
import TokenManager from './components/blockchain/TokenManager';

// Hooks
import { useAuth } from './hooks/useAuth';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Dashboard Router Component
function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'project_developer':
      return <ProjectDeveloperDashboard />;
    case 'credit_buyer':
      return <CreditBuyerDashboard />;
    case 'regulatory_body':
      return <RegulatoryDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <BlockchainProvider>
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
                    style: {
                      background: '#10b981',
                      color: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    style: {
                      background: '#ef4444',
                      color: '#fff',
                    },
                  },
                }}
              />
              
              <Header />
              
              <main className="min-h-screen">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Dashboard Routes */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <DashboardRouter />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Project Routes - Project Developers */}
                  <Route 
                    path="/projects" 
                    element={
                      <ProtectedRoute allowedRoles={['project_developer']}>
                        <ProjectList />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects/new" 
                    element={
                      <ProtectedRoute allowedRoles={['project_developer']}>
                        <ProjectRegistration />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects/:id" 
                    element={
                      <ProtectedRoute>
                        <ProjectDetails />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects/:id/edit" 
                    element={
                      <ProtectedRoute allowedRoles={['project_developer']}>
                        <ProjectRegistration />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects/:projectId/mrv-data" 
                    element={
                      <ProtectedRoute allowedRoles={['project_developer']}>
                        <MRVDataSubmission />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects/:projectId/claim-credits" 
                    element={
                      <ProtectedRoute allowedRoles={['project_developer']}>
                        <CreditClaim />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Credit Routes - All authenticated users can view */}
                  <Route 
                    path="/credits" 
                    element={
                      <ProtectedRoute>
                        <CreditHistory />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/credits/history" 
                    element={
                      <ProtectedRoute>
                        <CreditHistory />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Marketplace Routes - Credit Buyers */}
                  <Route 
                    path="/marketplace" 
                    element={
                      <ProtectedRoute allowedRoles={['credit_buyer']}>
                        <CreditMarketplace />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Verification Routes - Regulatory Bodies */}
                  <Route 
                    path="/verification/pending" 
                    element={
                      <ProtectedRoute allowedRoles={['regulatory_body']}>
                        <RegulatoryDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/verification/completed" 
                    element={
                      <ProtectedRoute allowedRoles={['regulatory_body']}>
                        <RegulatoryDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/credits/:creditId/verify" 
                    element={
                      <ProtectedRoute allowedRoles={['regulatory_body']}>
                        <CreditVerification />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Blockchain Routes */}
                  <Route 
                    path="/blockchain/transactions" 
                    element={
                      <ProtectedRoute>
                        <TransactionHistory />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/blockchain/explorer" 
                    element={
                      <ProtectedRoute>
                        <BlockchainExplorer />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/blockchain/tokens" 
                    element={
                      <ProtectedRoute allowedRoles={['regulatory_body', 'project_developer']}>
                        <TokenManager />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Error Routes */}
                  <Route path="/unauthorized" element={
                    <div className="flex items-center justify-center min-h-screen bg-gray-50">
                      <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md mx-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                        <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
                        <button
                          onClick={() => window.history.back()}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 mr-3"
                        >
                          Go Back
                        </button>
                        <button
                          onClick={() => window.location.href = '/dashboard'}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Dashboard
                        </button>
                      </div>
                    </div>
                  } />
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              
              <Footer />
            </div>
          </Router>
        </BlockchainProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;