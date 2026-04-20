import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import GlobalLoader from './components/GlobalLoader';

import PrivateRoute from './components/PrivateRoute'

// Code Splitting specifically isolating javascript bundles seamlessly decoupling upfront loading sequences 
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreatePlan = lazy(() => import('./pages/CreatePlan'));
const PlanDetails = lazy(() => import('./pages/PlanDetails'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

function Layout({ children }) {
  const { currentUser, logout } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white p-4 shadow-sm border-b border-indigo-400 flex justify-between items-center">
        <h1 className="text-xl font-bold">PlanSync</h1>
        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="avatar" 
                  className="w-8 h-8 rounded-full border-2 border-indigo-300 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-400 border-2 border-indigo-300 flex items-center justify-center text-sm font-bold uppercase">
                  {(currentUser.displayName || currentUser.email || '?')[0]}
                </div>
              )}
              <span className="text-sm font-medium hidden sm:inline truncate max-w-[160px]">
                {currentUser.displayName || currentUser.email}
              </span>
            </div>
            <button 
              onClick={logout} 
              className="text-sm bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              Log Out
            </button>
          </div>
        )}
      </header>
      <main className="flex-1 w-full relative">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  const { currentUser } = useAuth();

  return (
    <Layout>
      <Suspense fallback={<GlobalLoader />}>
        <Routes>
          {/* Secure Application Area (Dashboard) */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/create-plan" 
            element={
              <PrivateRoute>
                <CreatePlan />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/plan/:id" 
            element={
              <PrivateRoute>
                <PlanDetails />
              </PrivateRoute>
            } 
          />

          {/* Public Authentication Pages */}
          <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/signup" element={currentUser ? <Navigate to="/" replace /> : <Signup />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
