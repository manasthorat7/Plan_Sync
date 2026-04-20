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
          <button 
            onClick={logout} 
            className="text-sm bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm ml-4"
          >
            Log Out
          </button>
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
