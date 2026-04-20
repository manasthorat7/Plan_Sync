import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import GlobalLoader from './components/GlobalLoader';
import PrivateRoute from './components/PrivateRoute'

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreatePlan = lazy(() => import('./pages/CreatePlan'));
const PlanDetails = lazy(() => import('./pages/PlanDetails'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

function NavigationBar() {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/10 dark:bg-black/60 border-b border-white/20 dark:border-white/10 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200 dark:from-indigo-400 dark:to-purple-400 drop-shadow-sm">
            PlanSync
          </h1>
          
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur border border-white/30 dark:border-white/10 text-white dark:text-slate-300 hover:scale-110 transition-transform shadow-sm"
              title="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 4.22a1 1 0 011.415 0l.708.708a1 1 0 11-1.414 1.414l-.708-.708a1 1 0 010-1.414zm-9.84.708a1 1 0 010-1.415l.708-.708a1 1 0 111.414 1.414l-.708.708a1 1 0 01-1.414 0zM10 5a5 5 0 100 10 5 5 0 000-10zm-6 5a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm14 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm-9.84 5.07a1 1 0 011.414 0l.708.708a1 1 0 11-1.414 1.414l-.708-.708a1 1 0 010-1.414zm9.84.708a1 1 0 010-1.415l.708-.708a1 1 0 111.414 1.414l-.708.708a1 1 0 01-1.414 0zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clipRule="evenodd"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                </svg>
              )}
            </button>

            {/* Profile Drop */}
            {currentUser && (
              <div className="flex items-center gap-3 bg-white/15 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-white/30 dark:border-white/10 backdrop-blur shadow-sm">
                <div className="flex items-center gap-2">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="avatar" 
                      className="w-7 h-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                      {(currentUser.displayName || currentUser.email || '?')[0]}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-white dark:text-slate-100 hidden sm:inline truncate max-w-[140px]">
                    {currentUser.displayName || currentUser.email}
                  </span>
                </div>
                <button 
                  onClick={logout} 
                  className="text-xs font-bold bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white px-3 py-1 rounded-lg transition-colors border border-white/30 dark:border-white/10"
                >
                  Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative text-slate-900 dark:text-slate-100">
      
      {/* Fixed Gradient Viewport Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-950 dark:from-neutral-950 dark:via-black dark:to-neutral-900 transition-colors duration-500 ease-in-out" />
      
      <NavigationBar />
      
      <main className="flex-1 w-full relative">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Suspense fallback={<GlobalLoader />}>
          <Routes>
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/create-plan" element={<PrivateRoute><CreatePlan /></PrivateRoute>} />
            <Route path="/plan/:id" element={<PrivateRoute><PlanDetails /></PrivateRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </Suspense>
      </Layout>
    </ThemeProvider>
  )
}
